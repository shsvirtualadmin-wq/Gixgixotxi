import { HamburgerMenuSheet } from './HamburgerMenuSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  currentPath?: string;
}

export function DashboardMoreSheet({ open, onClose }: Props) {
  return <HamburgerMenuSheet isOpen={open} onClose={onClose} />;
}

export default DashboardMoreSheet;
