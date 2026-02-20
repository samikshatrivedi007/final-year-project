import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import './styles/index.css';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
