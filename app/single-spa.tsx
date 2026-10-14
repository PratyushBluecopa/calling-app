import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app";
import type { MfeProps } from "~/types";

/** Props passed by the host app when mounting this MFE. */
interface MountProps extends MfeProps {
  /** The DOM element to render into (required). */
  domElement: HTMLElement;
  /** Aliases the host may use instead of domElement. */
  container?: HTMLElement;
  element?: HTMLElement;
  root?: HTMLElement;
  /** Alias for basename used by some hosts. */
  baseUrl?: string;
}

let reactRoot: Root | null = null;

const MicrofrontendRoot: React.FC<{
  props?: MfeProps;
}> = ({ props }) => {
  return (
    <BrowserRouter basename={props?.basename}>
      <App {...props} />
    </BrowserRouter>
  );
};

/**
 * Resolves the DOM element from the various prop aliases the host may pass.
 * The host sends domElement, container, element, root — accept any of them.
 */
function resolveDomElement(props: MountProps): HTMLElement {
  const el = props.domElement || props.container || props.element || props.root;
  if (!el) {
    throw new Error(
      "domElement (or container/element/root) is required for mounting the MFE",
    );
  }
  return el;
}

/**
 * Mount the MFE into a given DOM element.
 * This is the primary entry point called by the host's single-spa-config.
 */
export async function mount(props: MountProps): Promise<void> {
  const domElement = resolveDomElement(props);

  try {
    // Clean up previous root if remounting
    if (reactRoot) {
      reactRoot.unmount();
      reactRoot = null;
    }

    reactRoot = createRoot(domElement);
    reactRoot.render(
      <MicrofrontendRoot
        props={{
          basename: props.basename || props.baseUrl,
          accessToken: props.accessToken,
          workspaceId: props.workspaceId,
          apiBaseUrl: props.apiBaseUrl,
          userId: props.userId,
          // Runtime config + schema map injected by the host. Forwarding these
          // is what lets a deployed app read its Settings → Env Vars config and
          // normalize API column names at runtime.
          envVars: props.envVars,
          schemaMap: props.schemaMap,
          // Logged-in user's permissions (host ran the backend check pre-mount).
          permissions: props.permissions,
        }}
      />,
    );
  } catch (error) {
    console.error("Failed to mount MFE:", error);
    throw error;
  }
}

/**
 * Unmount the MFE and clean up the React tree.
 */
export async function unmount(): Promise<void> {
  try {
    if (reactRoot) {
      reactRoot.unmount();
      reactRoot = null;
    }
  } catch (error) {
    console.error("Failed to unmount MFE:", error);
    throw error;
  }
}

/**
 * Bootstrap — no-op, required by single-spa contract.
 */
export async function bootstrap(): Promise<void> {}

/**
 * Default export provides the same lifecycle for Module Federation consumers
 * that import the default rather than named exports.
 */
export default { mount, unmount, bootstrap };
