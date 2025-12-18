export default function Toast({ message, type }: { message: string; type: "success" | "error" | "info" }) {
  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[type];

  return (
    <div className={`fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50 ${bgColor} animate-fade-in`}>
      {message}
    </div>
  );
}