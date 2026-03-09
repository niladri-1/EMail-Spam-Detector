import Navbar from "../components/Navbar";
import EmailList from "../components/EmailList";
import ChatBot from "../components/ChatBot";

function Dashboard() {
  return (
    <div>
      <Navbar showLogout={true} />
      <div className="container">
        <EmailList />
      </div>
      <ChatBot />
    </div>
  );
}

export default Dashboard;
