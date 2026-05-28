import TopBar from "./components/chrome/TopBar";
import Sidebar from "./components/chrome/Sidebar";
import Scene from "./components/board/Scene";

export default function App() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Scene />
        </main>
      </div>
    </div>
  );
}
