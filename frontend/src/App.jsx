import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api/api';
import { socket } from './socket';
import Navbar from './components/Navbar';
import KanbanBoard from './components/KanbanBoard';
import CardModal from './components/CardModal';
import ChatDrawer from './components/ChatDrawer';
import AuthModal from './components/AuthModal';
import MembersModal from './components/MembersModal';
import './App.css';

export default function App() {
  // Authentication & User State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Workspaces & Boards
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);

  // Kanban Cards & Chat
  const [cards, setCards] = useState([]);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);

  // UI Modals & Drawers
  const [selectedCard, setSelectedCard] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const boardLoadIdRef = useRef(0);
  const currentUserId = user?._id || user?.id;
  const activeBoardId = activeBoard?._id;

  // 1. Check logged-in user on initial mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthLoading(false);
      return;
    }

    api.getMe()
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  // 2. Fetch Workspaces when user is logged in
  const loadWorkspaces = useCallback(async () => {
    try {
      const data = await api.getWorkspaces();
      const wsList = data.workspaces || [];
      setWorkspaces(wsList);

      if (wsList.length > 0) {
        setActiveWorkspace(wsList[0]);
      } else {
        // Automatically create default workspace if user is fresh
        const created = await api.createWorkspace({
          name: 'Engineering Team',
          description: 'Default agile collaboration workspace',
        });
        setWorkspaces([created.workspace]);
        setActiveWorkspace(created.workspace);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user, loadWorkspaces]);

  // 3. Fetch Boards when Active Workspace changes
  const loadBoards = useCallback(async (workspaceId) => {
    try {
      const data = await api.getBoards(workspaceId);
      const bList = data.boards || [];
      setBoards(bList);

      if (bList.length > 0) {
        setActiveBoard(bList[0]);
      } else {
        // Auto-create default sprint board if none exists
        const newBrd = await api.createBoard({
          title: 'Sprint 1 Board',
          workspaceId,
        });
        setBoards([newBrd.board]);
        setActiveBoard(newBrd.board);
      }
    } catch (err) {
      console.error('Failed to load boards:', err);
    }
  }, []);

  useEffect(() => {
    if (activeWorkspace) {
      loadBoards(activeWorkspace._id);
    }
  }, [activeWorkspace, loadBoards]);

  // 4. Fetch Cards & Messages when Active Board changes
  const loadBoardData = useCallback(async (boardId) => {
    const loadId = ++boardLoadIdRef.current;
    try {
      const [cardsData, msgsData] = await Promise.all([
        api.getCards(boardId),
        api.getMessages(boardId),
      ]);
      if (loadId !== boardLoadIdRef.current) return;

      setCards(cardsData.cards || []);
      const history = Array.isArray(msgsData) ? msgsData : msgsData.data || [];
      setMessages((current) => {
        const byId = new Map();
        [...history, ...current].forEach((message) => {
          if (message._id) byId.set(String(message._id), message);
        });
        return Array.from(byId.values()).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
    } catch (err) {
      console.error('Failed to load board data:', err);
    }
  }, []);

  useEffect(() => {
    if (activeBoardId) {
      setCards([]);
      setMessages([]);
      setOnlineUsers([]);
      setTypingUser(null);
      loadBoardData(activeBoardId);
    } else {
      boardLoadIdRef.current += 1;
      setCards([]);
      setMessages([]);
      setOnlineUsers([]);
      setTypingUser(null);
    }
  }, [activeBoardId, loadBoardData]);

  // 5. Real-Time Socket.io Connection & Event Listeners
  useEffect(() => {
    if (!currentUserId || !activeBoardId) return;

    const joinBoard = () => {
      socket.emit('join_board', {
        boardId: activeBoardId,
        userId: currentUserId,
        user: { name: user.name, avatar: user.avatar },
      });
    };

    // Handle real-time presence sync
    const handlePresence = ({ activeUsers }) => {
      setOnlineUsers(activeUsers || []);
    };

    // Handle real-time card move
    const handleCardMoved = (data) => {
      setCards((prev) =>
        prev.map((c) =>
          c._id === data.cardId
            ? { ...c, listId: data.targetListId, position: data.newPosition }
            : c
        )
      );
    };

    // Handle real-time card created
    const handleCardCreated = ({ card }) => {
      if (!card || !card._id) return;
      setCards((prev) => {
        if (prev.some((c) => c._id.toString() === card._id.toString())) return prev;
        return [...prev, card];
      });
    };

    // Handle real-time card updated
    const handleCardUpdated = ({ card }) => {
      if (!card || !card._id) return;
      setCards((prev) =>
        prev.map((c) => (c._id.toString() === card._id.toString() ? card : c))
      );
      setSelectedCard((prev) =>
        prev?._id?.toString() === card._id.toString() ? card : prev
      );
    };

    // Handle real-time card deleted
    const handleCardDeleted = ({ cardId }) => {
      setCards((prev) => prev.filter((c) => c._id.toString() !== cardId.toString()));
    };

    // Handle real-time chat message
    const handleNewMessage = (msg) => {
      if (!msg || !msg._id) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id.toString() === msg._id.toString())) return prev;
        return [...prev, msg];
      });
    };

    // Handle typing indicator
    const handleUserTyping = ({ user: typingUserData, isTyping }) => {
      if (String(typingUserData?.id) !== String(currentUserId)) {
        setTypingUser(isTyping ? typingUserData?.name : null);
      }
    };

    socket.on('connect', joinBoard);
    socket.on('presence_sync', handlePresence);
    socket.on('card_moved', handleCardMoved);
    socket.on('card_created', handleCardCreated);
    socket.on('card_updated', handleCardUpdated);
    socket.on('card_deleted', handleCardDeleted);
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    if (socket.connected) {
      joinBoard();
    } else {
      socket.connect();
    }

    // Cleanup listeners and leave room on board change / unmount
    return () => {
      socket.off('connect', joinBoard);
      if (socket.connected) {
        socket.emit('leave_board', { boardId: activeBoardId });
      }
      socket.off('presence_sync', handlePresence);
      socket.off('card_moved', handleCardMoved);
      socket.off('card_created', handleCardCreated);
      socket.off('card_updated', handleCardUpdated);
      socket.off('card_deleted', handleCardDeleted);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [currentUserId, user?.name, user?.avatar, activeBoardId]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // Move card (Optimistic update for 0ms lag + API sync)
  const handleMoveCard = async (cardId, targetListId) => {
    if (!activeBoardId) return;
    const newPosition = cards.filter(
      (card) => card.listId === targetListId && card._id !== cardId
    ).length;

    // 1. Optimistic local update
    setCards((prev) =>
      prev.map((c) =>
        c._id === cardId ? { ...c, listId: targetListId, position: newPosition } : c
      )
    );

    // The API saves the move and broadcasts one update to other board members.
    try {
      await api.moveCard(cardId, { targetListId, newPosition });
    } catch (err) {
      console.error('Failed to move card on server:', err);
      // Revert from server if failed
      loadBoardData(activeBoardId);
    }
  };

  // Add Card
  const handleAddCard = async (listId, title, priority) => {
    try {
      const res = await api.createCard({
        title,
        boardId: activeBoard._id,
        listId,
        priority,
      });
      // Ensure card is not added twice if socket already delivered it
      if (res.card && res.card._id) {
        setCards((prev) => {
          if (prev.some((c) => c._id.toString() === res.card._id.toString())) return prev;
          return [...prev, res.card];
        });
      }
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  };

  // Update Card
  const handleUpdateCard = async (cardId, updateData) => {
    try {
      const res = await api.updateCard(cardId, updateData);
      if (res.card) {
        setCards((prev) => prev.map((c) => (c._id === cardId ? res.card : c)));
      }
    } catch (err) {
      console.error('Failed to update card:', err);
    }
  };

  // Delete Card
  const handleDeleteCard = async (cardId) => {
    try {
      await api.deleteCard(cardId);
      setCards((prev) => prev.filter((c) => c._id !== cardId));
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  // Add Column / List to Board
  const handleAddList = async (title) => {
    try {
      const res = await api.addList(activeBoard._id, { title });
      if (res.board) {
        setActiveBoard(res.board);
        setBoards((prev) => prev.map((b) => (b._id === res.board._id ? res.board : b)));
      }
    } catch (err) {
      console.error('Failed to add list:', err);
    }
  };

  // Delete Column / List
  const handleDeleteList = async (listId) => {
    try {
      const res = await api.deleteList(activeBoard._id, listId);
      if (res.board) {
        setActiveBoard(res.board);
        setBoards((prev) => prev.map((b) => (b._id === res.board._id ? res.board : b)));
        // Also remove local cards belonging to that list
        setCards((prev) => prev.filter((c) => c.listId !== listId));
      }
    } catch (err) {
      console.error('Failed to delete list:', err);
    }
  };

  // Send Chat Message via Socket.io
  const handleSendMessage = (content) => {
    if (!activeBoardId || !currentUserId || !socket.connected) {
      return Promise.reject(new Error('Chat is disconnected. Please try again.'));
    }

    return new Promise((resolve, reject) => {
      socket.timeout(5000).emit('send_message', {
        boardId: activeBoardId,
        senderId: currentUserId,
        content,
      }, (timeoutError, response) => {
        if (timeoutError) {
          reject(new Error('Message was not acknowledged. Please try again.'));
        } else if (!response?.ok) {
          reject(new Error(response?.message || 'Message could not be sent.'));
        } else {
          resolve();
        }
      });
    });
  };

  // Send Typing Indicator
  const handleTyping = (isTyping) => {
    if (!activeBoardId || !currentUserId) return;
    socket.emit('user_typing', {
      boardId: activeBoardId,
      user: { id: currentUserId, name: user.name },
      isTyping,
    });
  };

  // Create Workspace
  const handleCreateWorkspace = async (name) => {
    try {
      const res = await api.createWorkspace({ name });
      if (res.workspace) {
        setWorkspaces((prev) => [...prev, res.workspace]);
        setActiveWorkspace(res.workspace);
      }
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  };

  // Create Board
  const handleCreateBoard = async (title) => {
    try {
      const res = await api.createBoard({
        title,
        workspaceId: activeWorkspace._id,
      });
      if (res.board) {
        setBoards((prev) => [...prev, res.board]);
        setActiveBoard(res.board);
      }
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  };

  // Update workspace when members are added/removed
  const handleWorkspaceUpdated = (updatedWs) => {
    setActiveWorkspace(updatedWs);
    setWorkspaces((prev) =>
      prev.map((w) => (w._id === updatedWs._id ? updatedWs : w))
    );
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    socket.disconnect();
    setUser(null);
    setWorkspaces([]);
    setBoards([]);
    setActiveWorkspace(null);
    setActiveBoard(null);
    setCards([]);
    setMessages([]);
    setOnlineUsers([]);
    setTypingUser(null);
  };

  // Loading state during auth check
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading TaskPulse...</p>
      </div>
    );
  }

  // Not Logged In -> Show Auth Screen
  if (!user) {
    return <AuthModal onAuthSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <div className="app-layout">
      {/* Top Navigation Bar */}
      <Navbar
        user={user}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        boards={boards}
        activeBoard={activeBoard}
        onSelectBoard={setActiveBoard}
        onCreateBoard={handleCreateBoard}
        onlineUsers={onlineUsers}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        onOpenMembers={() => setIsMembersOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Body */}
      <main className="main-content">
        <KanbanBoard
          board={activeBoard}
          cards={cards}
          onCardClick={(card) => setSelectedCard(card)}
          onAddCard={handleAddCard}
          onMoveCard={handleMoveCard}
          onAddList={handleAddList}
          onDeleteList={handleDeleteList}
        />

        {/* Collapsible Real-Time Chat Drawer */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          boardTitle={activeBoard?.title}
          messages={messages}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          typingUser={typingUser}
          currentUser={user}
        />
      </main>

      {/* Task Card Details & Edit Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
        />
      )}

      {/* Workspace Members Management Modal */}
      {isMembersOpen && activeWorkspace && (
        <MembersModal
          workspace={activeWorkspace}
          currentUser={user}
          onClose={() => setIsMembersOpen(false)}
          onWorkspaceUpdated={handleWorkspaceUpdated}
        />
      )}
    </div>
  );
}
