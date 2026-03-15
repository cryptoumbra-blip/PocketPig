import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Progress from './screens/Progress';
import Rewards from './screens/Rewards';
import Profile from './screens/Profile';
import Premium from './screens/Premium';
import Referral from './screens/Referral';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Onboarding,
  },
  {
    Component: Layout,
    children: [
      { path: '/home', Component: Home },
      { path: '/progress', Component: Progress },
      { path: '/rewards', Component: Rewards },
      { path: '/profile', Component: Profile },
      { path: '/premium', Component: Premium },
      { path: '/referral', Component: Referral },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
