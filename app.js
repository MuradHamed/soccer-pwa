const { createContext, useContext, useReducer, useState, useEffect, useRef } = React;

// Supabase client configuration
const supabaseUrl = 'https://rqpcxbzfvufekaihnmct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcGN4YnpmdnVmZWthaWhubWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMzA4NTAsImV4cCI6MjA2NDgwNjg1MH0.mo6COppydSth-qsLGmREFP1yETVpGH1f3CBXbhKDs4M';

// Enhanced Supabase client
const supabase = {
    from: (table) => ({
        select: (columns = '*') => ({
            order: (column, options) => ({
                then: async (callback) => {
                    try {
                        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}&order=${column}.${options.ascending ? 'asc' : 'desc'}`, {
                            headers: {
                                'apikey': supabaseKey,
                                'Authorization': `Bearer ${supabaseKey}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        const data = await response.json();
                        callback({ data: response.ok ? data : [], error: response.ok ? null : data });
                    } catch (error) {
                        callback({ data: [], error });
                    }
                }
            }),
            then: async (callback) => {
                try {
                    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}`, {
                        headers: {
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    const data = await response.json();
                    callback({ data: response.ok ? data : [], error: response.ok ? null : data });
                } catch (error) {
                    callback({ data: [], error });
                }
            }
        }),
        insert: (data) => ({
            select: () => ({
                single: () => ({
                    then: async (callback) => {
                        try {
                            const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
                                method: 'POST',
                                headers: {
                                    'apikey': supabaseKey,
                                    'Authorization': `Bearer ${supabaseKey}`,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=representation'
                                },
                                body: JSON.stringify(data[0])
                            });
                            const result = await response.json();
                            const playerData = Array.isArray(result) && result.length > 0 ? result[0] : result;
                            callback({ 
                                data: response.ok ? playerData : null, 
                                error: response.ok ? null : playerData 
                            });
                        } catch (error) {
                            callback({ data: null, error });
                        }
                    }
                })
            })
        }),
        delete: () => ({
            eq: (column, value) => ({
                then: async (callback) => {
                    if (value === undefined || value === null) {
                        callback({ error: "Invalid value" });
                        return;
                    }
                    try {
                        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
                            method: 'DELETE',
                            headers: {
                                'apikey': supabaseKey,
                                'Authorization': `Bearer ${supabaseKey}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        callback({ error: response.ok ? null : await response.json() });
                    } catch (error) {
                        callback({ error });
                    }
                }
            })
        })
    })
};

// State Management
const AppContext = createContext();

const initialState = {
    players: [],
    orangeTeam: [],
    greenTeam: [],
    loading: false,
    error: null
};

function appReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'SET_PLAYERS':
            return { ...state, players: action.payload, loading: false };
        case 'SET_TEAMS':
            return { 
                ...state, 
                orangeTeam: action.payload.orange,
                greenTeam: action.payload.green,
                loading: false 
            };
        case 'ADD_PLAYER_LOCAL':
            return {
                ...state,
                players: [...state.players, action.payload]
            };
        case 'REMOVE_PLAYER_LOCAL':
            return {
                ...state,
                players: state.players.filter(p => p.id !== action.payload),
                orangeTeam: state.orangeTeam.filter(p => p.id !== action.payload),
                greenTeam: state.greenTeam.filter(p => p.id !== action.payload)
            };
        case 'UPDATE_TEAMS_LOCAL':
            return {
                ...state,
                orangeTeam: action.payload.orange,
                greenTeam: action.payload.green
            };
        default:
            return state;
    }
}

function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    
    const loadData = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            
            // Load players
            const { data: players, error: playersError } = await new Promise(resolve => {
                supabase
                    .from('players')
                    .select('*')
                    .order('created_at', { ascending: true })
                    .then(resolve);
            });
            
            if (playersError) throw playersError;
            
            // Load teams with explicit columns
            const { data: teams, error: teamsError } = await new Promise(resolve => {
                supabase
                    .from('teams')
                    .select('player_id, team_color')
                    .then(resolve);
            });
            
            if (teamsError) throw teamsError;
            
            console.log('Loaded data:', { players, teams });
            
            // Organize teams
            const orangeTeam = [];
            const greenTeam = [];
            
            teams?.forEach(team => {
                const player = players?.find(p => Number(p.id) === Number(team.player_id));
                if (player) {
                    if (team.team_color === 'orange') {
                        orangeTeam.push(player);
                    } else if (team.team_color === 'green') {
                        greenTeam.push(player);
                    }
                }
            });

            console.log('Organized teams:', { orangeTeam, greenTeam });
            
            dispatch({ type: 'SET_PLAYERS', payload: players || [] });
            dispatch({ type: 'SET_TEAMS', payload: { orange: orangeTeam, green: greenTeam } });
            
        } catch (error) {
            console.error('Error loading data:', error);
            dispatch({ type: 'SET_ERROR', payload: `Database error: ${error.message}` });
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const addPlayer = async (name) => {
        try {
            const { data, error } = await supabase
                .from('players')
                .insert([{ name }])
                .select()
                .single();
            
            if (error) throw error;
            dispatch({ type: 'ADD_PLAYER_LOCAL', payload: data });
            
        } catch (error) {
            console.error('Error adding player:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };

    const removePlayer = async (playerId) => {
        if (!playerId) {
            console.error('Invalid player ID');
            return;
        }
        
        try {
            await supabase.from('teams').delete().eq('player_id', playerId);
            const { error } = await supabase.from('players').delete().eq('id', playerId);
            
            if (error) throw error;
            dispatch({ type: 'REMOVE_PLAYER_LOCAL', payload: playerId });
            
        } catch (error) {
            console.error('Error removing player:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };

    const moveToTeam = async (playerId, teamColor) => {
        if (!playerId) {
            console.error('Invalid player ID');
            return;
        }

        try {
            const numericPlayerId = Number(playerId);
            console.log('Moving player:', { playerId: numericPlayerId, to: teamColor });

            // First delete any existing assignment
            const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/teams?player_id=eq.${numericPlayerId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!deleteResponse.ok) {
                console.error('Delete failed:', await deleteResponse.text());
            }

            // Insert new team assignment
            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/teams`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    player_id: numericPlayerId,
                    team_color: teamColor
                })
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                console.error('Insert failed:', errorText);
                throw new Error('Failed to save team assignment');
            }

            const result = await insertResponse.json();
            console.log('Team assignment saved:', result);

            // Update local state
            const player = state.players.find(p => p.id === numericPlayerId);
            if (!player) {
                throw new Error('Player not found');
            }

            const updatedOrange = state.orangeTeam.filter(p => p.id !== numericPlayerId);
            const updatedGreen = state.greenTeam.filter(p => p.id !== numericPlayerId);

            if (teamColor === 'orange') {
                updatedOrange.push(player);
            } else if (teamColor === 'green') {
                updatedGreen.push(player);
            }

            dispatch({
                type: 'UPDATE_TEAMS_LOCAL',
                payload: { 
                    orange: updatedOrange, 
                    green: updatedGreen 
                }
            });

            console.log('Local state updated:', {
                player: player.name,
                team: teamColor,
                orangeSize: updatedOrange.length,
                greenSize: updatedGreen.length
            });

        } catch (error) {
            console.error('Error moving player:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to save team assignment' });
        }
    };

    const removeFromTeam = async (playerId) => {
        if (!playerId) {
            console.error('Invalid player ID');
            return;
        }
        
        try {
            const numericPlayerId = Number(playerId);
            
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('player_id', numericPlayerId);

            if (error) throw error;
            
            const updatedOrange = state.orangeTeam.filter(p => p.id !== numericPlayerId);
            const updatedGreen = state.greenTeam.filter(p => p.id !== numericPlayerId);
            
            dispatch({ 
                type: 'UPDATE_TEAMS_LOCAL', 
                payload: { orange: updatedOrange, green: updatedGreen } 
            });
            
        } catch (error) {
            console.error('Error removing from team:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };
    
    return React.createElement(AppContext.Provider, {
        value: { 
            state, 
            dispatch,
            addPlayer,
            removePlayer,
            moveToTeam,
            removeFromTeam,
            loadData
        }
    }, children);
}

function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}

// Components
function PullToRefresh({ onRefresh, children }) {
    const { state } = useApp();
    const [pullState, setPullState] = useState({ 
        pulling: false, 
        distance: 0,
        refreshing: false
    });
    
    const startY = useRef(0);
    const containerRef = useRef(null);
    
    useEffect(() => {
        if (state.loading) {
            setPullState(prev => ({ ...prev, refreshing: true }));
        } else {
            setPullState(prev => ({ ...prev, refreshing: false }));
        }
    }, [state.loading]);
    
    const handleTouchStart = (e) => {
        if (window.scrollY <= 0 && !state.loading) {
            startY.current = e.touches[0].clientY;
            setPullState({ pulling: true, distance: 0, refreshing: false });
        }
    };
    
    const handleTouchMove = (e) => {
        if (!pullState.pulling) return;
        
        const currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startY.current);
        
        if (distance > 0 && window.scrollY <= 0) {
            setPullState({ 
                pulling: true, 
                distance: Math.min(distance, 100),
                refreshing: false
            });
            
            if (distance > 10) {
                e.preventDefault();
            }
        }
    };
    
    const handleTouchEnd = () => {
        if (!pullState.pulling) return;
        
        if (pullState.distance > 60) {
            setPullState({ 
                pulling: false, 
                distance: 0,
                refreshing: true 
            });
            onRefresh();
        } else {
            setPullState({ 
                pulling: false, 
                distance: 0,
                refreshing: false 
            });
        }
    };
    
    const arrowSvg = React.createElement('svg', {
        viewBox: "0 0 24 24",
        className: "w-6 h-6 stroke-current",
        fill: "none",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
    },
        React.createElement('path', { d: "M12 5v14" }),
        React.createElement('path', { d: "M19 12l-7 7-7-7" })
    );
    
    return React.createElement('div', {
        ref: containerRef,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        style: { position: 'relative' }
    },
        React.createElement('div', {
            className: `pull-to-refresh ${pullState.refreshing ? 'refreshing' : ''}`,
            style: { 
                transform: `translateY(${pullState.distance}px)`,
                opacity: pullState.pulling || pullState.refreshing ? 1 : 0
            }
        },
            React.createElement('div', { className: "pull-indicator" },
                pullState.refreshing 
                    ? React.createElement('div', { className: "loader" }) 
                    : arrowSvg
            )
        ),
        children
    );
}

function NavBar() {
    return React.createElement('nav', {
        className: "bg-gray-900 border-b border-gray-700 px-4 py-3"
    }, 
        React.createElement('h1', {
            className: "text-white text-xl font-bold text-center"
        }, '⚽ Soccer Teams')
    );
}

function TabBar({ activeTab, onTabChange }) {
    return React.createElement('div', {
        className: "bg-gray-800 border-b border-gray-700"
    },
        React.createElement('div', { className: "flex" },
            React.createElement('button', {
                onClick: () => onTabChange('add-remove'),
                className: `flex-1 py-3 text-center font-medium transition-colors ${
                    activeTab === 'add-remove' 
                        ? 'text-blue-400 bg-gray-700 border-b-2 border-blue-400' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`
            }, 'Add / Remove'),
            React.createElement('button', {
                onClick: () => onTabChange('teams'),
                className: `flex-1 py-3 text-center font-medium transition-colors ${
                    activeTab === 'teams' 
                        ? 'text-blue-400 bg-gray-700 border-b-2 border-blue-400' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`
            }, 'Teams')
        )
    );
}

function ErrorBanner({ error, onDismiss }) {
    if (!error) return null;
    
    return React.createElement('div', {
        className: "bg-red-900 border border-red-700 text-red-200 px-4 py-3 mx-4 mt-4 rounded-lg flex justify-between items-center"
    },
        React.createElement('span', { className: "text-sm" }, error),
        React.createElement('button', {
            onClick: onDismiss,
            className: "text-red-400 hover:text-red-200 ml-4 text-lg"
        }, '×')
    );
}

function AddRemoveTab() {
    const { state, addPlayer, removePlayer, dispatch, loadData } = useApp();
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            await addPlayer(inputValue.trim());
            setInputValue('');
        }
    };

    const handleRemovePlayer = async (id) => {
        await removePlayer(id);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return React.createElement(PullToRefresh, { onRefresh: loadData },
        React.createElement('div', { className: "p-4 max-w-md mx-auto" },
            React.createElement(ErrorBanner, {
                error: state.error,
                onDismiss: () => dispatch({ type: 'SET_ERROR', payload: null })
            }),
            React.createElement('div', { className: "mb-6" },
                React.createElement('div', { className: "flex gap-2" },
                    React.createElement('input', {
                        type: "text",
                        value: inputValue,
                        onChange: (e) => setInputValue(e.target.value),
                        onKeyPress: handleKeyPress,
                        placeholder: "Enter player name",
                        disabled: state.loading,
                        className: "flex-1 px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    }),
                    React.createElement('button', {
                        onClick: handleSubmit,
                        disabled: state.loading || !inputValue.trim(),
                        className: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    }, state.loading ? '...' : 'Add')
                )
            ),
            React.createElement('div', { className: "space-y-2" },
                React.createElement('h2', { className: "text-white text-lg font-semibold mb-3" },
                    `Players (${state.players.length})`
                ),
                state.loading ? 
                    React.createElement('p', { className: "text-gray-400 text-center py-8" }, 'Loading...') :
                    state.players.length === 0 ?
                        React.createElement('p', { className: "text-gray-400 text-center py-8 italic" },
                            'No players yet. Add some names above!'
                        ) :
                        React.createElement('div', { className: "space-y-2" },
                            state.players.map((player) =>
                                React.createElement('div', {
                                    key: player.id,
                                    onClick: () => handleRemovePlayer(player.id),
                                    className: "flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
                                },
                                    React.createElement('span', { className: "text-white" }, player.name),
                                    React.createElement('span', { className: "text-red-400 text-sm" }, 'Tap to remove')
                                )
                            )
                        )
            )
        )
    );
}

function DragDropTeam({ team, teamColor, onDrop, onRemove, title }) {
    const [dragOver, setDragOver] = useState(false);
    const [touchStartData, setTouchStartData] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const playerId = e.dataTransfer.getData('text/plain');
        console.log('Drop event:', { playerId, teamColor });
        
        if (playerId) {
            const numericPlayerId = parseInt(playerId, 10);
            if (!isNaN(numericPlayerId)) {
                onDrop(numericPlayerId);
            }
        }
    };

    const handleTouchStart = (e, playerId) => {
        setTouchStartData({
            playerId,
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            moved: false
        });
    };

    const handleTouchMove = (e) => {
        if (touchStartData) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartData.startX;
            const deltaY = touch.clientY - touchStartData.startY;
            
            // If moved more than 10px, mark as moved
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                setTouchStartData(prev => ({ ...prev, moved: true }));
            }
        }
    };

    const handleTouchEnd = (e, playerId) => {
        if (touchStartData) {
            if (!touchStartData.moved) {
                // If didn't move, treat as a tap/click
                onRemove(playerId);
            }
            setTouchStartData(null);
        }
    };

    const colorClasses = {
        orange: dragOver ? 'border-orange-300 bg-orange-500/20' : 'border-orange-500 bg-orange-500/10',
        green: dragOver ? 'border-green-300 bg-green-500/20' : 'border-green-500 bg-green-500/10'
    };

    return React.createElement('div', {
        className: `team-dropzone team-${teamColor} flex-1 min-h-64 p-4 border-2 border-dashed rounded-lg transition-colors ${colorClasses[teamColor]}`,
        'data-team': teamColor,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop
    },
        React.createElement('h3', {
            className: `text-lg font-bold mb-3 text-center ${teamColor === 'orange' ? 'text-orange-400' : 'text-green-400'}`
        }, `${title} (${team.length})`),
        React.createElement('div', { className: "space-y-2" },
            team.map((player) =>
                React.createElement('div', {
                    key: player.id,
                    className: "p-2 bg-gray-800 rounded text-white text-center transition-colors relative group",
                    onTouchStart: (e) => handleTouchStart(e, player.id),
                    onTouchMove: handleTouchMove,
                    onTouchEnd: (e) => handleTouchEnd(e, player.id)
                },
                    player.name,
                    React.createElement('span', {
                        className: "absolute top-1 right-2 text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    }, '×')
                )
            ),
            team.length === 0 &&
                React.createElement('p', { className: "text-gray-400 text-center py-8 italic" },
                    'Drag players here'
                )
        )
    );
}

function TeamsTab() {
    const { state, moveToTeam, removeFromTeam, dispatch, loadData } = useApp();
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e, playerId) => {
        console.log('Drag start:', playerId);
        e.dataTransfer.setData('text/plain', playerId.toString());
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);

        // Add dragging class to body
        document.body.classList.add('dragging');
        
        // Create custom drag image
        const dragImage = document.createElement('div');
        dragImage.className = 'drag-image';
        dragImage.textContent = state.players.find(p => p.id === playerId)?.name || '';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        
        // Remove drag image after drag starts
        requestAnimationFrame(() => {
            document.body.removeChild(dragImage);
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        document.body.classList.remove('dragging');
    };

    const handleMoveToOrange = async (playerId) => {
        console.log('Moving to Orange:', playerId);
        await moveToTeam(playerId, 'orange');
    };

    const handleMoveToGreen = async (playerId) => {
        console.log('Moving to Green:', playerId);
        await moveToTeam(playerId, 'green');
    };

    const handleRemoveFromTeam = async (playerId) => {
        console.log('Removing from team:', playerId);
        await removeFromTeam(playerId);
    };

    const availablePlayers = state.players.filter(
        player => !state.orangeTeam.find(p => p.id === player.id) && 
                  !state.greenTeam.find(p => p.id === player.id)
    );

    return React.createElement(PullToRefresh, { onRefresh: loadData },
        React.createElement('div', { className: "p-4 max-w-4xl mx-auto" },
            React.createElement(ErrorBanner, {
                error: state.error,
                onDismiss: () => dispatch({ type: 'SET_ERROR', payload: null })
            }),
            React.createElement('div', { className: "mb-6" },
                React.createElement('h2', { className: "text-white text-lg font-semibold mb-3" },
                    `Available Players (${availablePlayers.length})`
                ),
                state.loading ?
                    React.createElement('p', { className: "text-gray-400 text-center py-4" }, 'Loading...') :
                    availablePlayers.length === 0 ?
                        React.createElement('p', { className: "text-gray-400 text-center py-4 italic" },
                            state.players.length === 0 ? 'No players added yet. Go to Add/Remove tab to add players.' : 'All players are assigned to teams'
                        ) :
                        React.createElement('div', { className: "flex flex-wrap gap-2" },
                            availablePlayers.map((player) =>
                                React.createElement('div', {
                                    key: player.id,
                                    draggable: true,
                                    onDragStart: (e) => handleDragStart(e, player.id),
                                    onDragEnd: handleDragEnd,
                                    className: "px-3 py-2 bg-gray-700 text-white rounded-lg cursor-move hover:bg-gray-600 transition-colors select-none"
                                }, player.name)
                            )
                        )
            ),
            React.createElement('div', { className: "flex gap-4 flex-col sm:flex-row" },
                React.createElement(DragDropTeam, {
                    team: state.orangeTeam,
                    teamColor: "orange",
                    onDrop: handleMoveToOrange,
                    onRemove: handleRemoveFromTeam,
                    title: "🟠 Orange Team"
                }),
                React.createElement(DragDropTeam, {
                    team: state.greenTeam,
                    teamColor: "green",
                    onDrop: handleMoveToGreen,
                    onRemove: handleRemoveFromTeam,
                    title: "🟢 Green Team"
                })
            )
        )
    );
}

function App() {
    const [activeTab, setActiveTab] = useState('add-remove');

    return React.createElement(AppProvider, {},
        React.createElement('div', { className: "min-h-screen bg-gray-900" },
            React.createElement(NavBar),
            React.createElement(TabBar, {
                activeTab: activeTab,
                onTabChange: setActiveTab
            }),
            React.createElement('main', { className: "pb-4" },
                activeTab === 'add-remove' && React.createElement(AddRemoveTab),
                activeTab === 'teams' && React.createElement(TeamsTab)
            )
        )
    );
}



// Initialize the app
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(React.createElement(App));