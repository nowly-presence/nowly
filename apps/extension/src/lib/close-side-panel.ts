type ChromeWithSidebarAction = typeof chrome & {
  sidebarAction?: {
    close?: () => Promise<void>;
  };
};

export const closeSidePanel = (): void => {
  const sidebar = (chrome as ChromeWithSidebarAction).sidebarAction;

  if (sidebar?.close) {
    void sidebar.close().catch(() => window.close());
    return;
  }

  window.close();
};