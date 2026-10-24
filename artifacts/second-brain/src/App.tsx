import { Route, Switch } from "wouter";
import ConnectedPage from "@/pages/Connected";
import DashboardPage from "@/pages/Dashboard";
import HomePage from "@/pages/Home";
import SignInPage from "@/pages/SignIn";
import StatsPage from "@/pages/Stats";

function App() {
  return (
    <Switch>
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/stats" component={StatsPage} />
      <Route path="/connected" component={ConnectedPage} />
      <Route component={HomePage} />
    </Switch>
  );
}

export default App;
