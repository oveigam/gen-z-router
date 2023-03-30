import { useQuery } from "@tanstack/react-query";
import reactLogo from "./assets/react.svg";
import { PowerRangerApi } from "./_api/apis/PowerRangerApi";
import { Configuration } from "./_api/runtime";
import viteLogo from "/vite.svg";

const api = new PowerRangerApi(
  new Configuration({
    basePath: "http://localhost:8000",
  })
);

function App() {
  const { data } = useQuery({
    queryKey: ["gogopowerrangers"],
    queryFn: () => {
      return api.getManyPowerRanger({});
    },
  });

  return (
    <div className="container">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <ul>
          {data?.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </div>
  );
}

export default App;
