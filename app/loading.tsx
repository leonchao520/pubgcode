import LoadingCard from "@/components/LoadingCard";

export default function Loading() {
  return (
    <div style={{
      backgroundColor: "#000", color: "#fff", minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: "640px" }}>
        <LoadingCard />
      </div>
    </div>
  );
}
