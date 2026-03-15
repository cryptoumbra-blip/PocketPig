import { createBrowserRouter, Navigate } from 'react-router';
import Home from './screens/Home';
import Progress from './screens/Progress';
import Rewards from './screens/Rewards';
import Profile from './screens/Profile';
import Dca from './screens/Dca';
import Wallet from './screens/Wallet';
import { ProtectedLayout, RootRoute } from './RouteGate';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootRoute,
  },
  {
    Component: ProtectedLayout,
    children: [
      { path: '/home', Component: Home },
      { path: '/progress', Component: Progress },
      { path: '/rewards', Component: Rewards },
      { path: '/dca', Component: Dca },
      { path: '/wallet', Component: Wallet },
      { path: '/profile', Component: Profile },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
