/**
 * Full-screen loading indicator shown while the app is initializing
 * (config, CSS, user data). Uses inline styles so it renders correctly
 * even before Tailwind CSS is fully loaded.
 */
export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100%",
        background: "#f8f8fa",
        fontFamily: "'Satoshi', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #e5e7eb",
            borderTopColor: "#3548ff",
            borderRadius: "50%",
            animation: "init-spin 0.7s linear infinite",
          }}
        />
        <span style={{ color: "#6b7280", fontSize: "0.835rem" }}>{message}</span>
      </div>
    </div>
  );
}
