import { AbsoluteFill } from "remotion";

export const BlankTemplate: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1
        style={{
          fontSize: 80,
          fontWeight: "bold",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Remotion Template
      </h1>
    </AbsoluteFill>
  );
};
