import { Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { useApp } from './context/AppContext';
import Onboarding from './screens/Onboarding';

export function RootRoute() {
  const { isOnboarded, providerKind, walletReadyForTransactions, walletDeployed } = useApp();
  const mustFinishWalletActivation =
    isOnboarded &&
    providerKind === 'privy' &&
    walletDeployed === false &&
    !walletReadyForTransactions;
  return isOnboarded && !mustFinishWalletActivation ? <Navigate to="/home" replace /> : <Onboarding />;
}

export function ProtectedLayout() {
  const { isOnboarded, providerKind, walletReadyForTransactions, walletDeployed } = useApp();
  const canEnterApp =
    isOnboarded &&
    (providerKind !== 'privy' || walletReadyForTransactions || walletDeployed !== false);
  return canEnterApp ? <Layout /> : <Navigate to="/" replace />;
}
