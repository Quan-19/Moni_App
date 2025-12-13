import React, { useEffect, useState } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { store } from "./store";
import AppNavigator from "./navigation/AuthStack";
import { auth } from "./firebaseConfig";

export default function App() {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setIsReady(true);
    });

    return unsubscribe;
  }, []);

  if (!isReady) return null;

  return (
    <ReduxProvider store={store}>
      <NavigationContainer>
        <AppNavigator user={user} />
      </NavigationContainer>
    </ReduxProvider>
  );
}
