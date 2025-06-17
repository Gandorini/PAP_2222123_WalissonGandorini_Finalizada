import { CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router } from 'react-router-dom';
import ThemeProvider from './context/ThemeContext';
import AppRoutes from './routes';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useLikeStore } from './store/likeStore';

function GlobalLikesSync() {
  const { user } = useAuthStore();
  const { fetchUserLikes } = useLikeStore();
  useEffect(() => {
    if (user) {
      fetchUserLikes();
    }
  }, [user, fetchUserLikes]);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
            <GlobalLikesSync />
            <AppRoutes />
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;