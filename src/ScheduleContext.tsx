import React, { createContext, PropsWithChildren, useContext, useState } from "react";
import { Schedule } from "./types.ts";
import dummyScheduleMap from "./dummyScheduleMap.ts";

const SchedulesStateContext = createContext<Record<string, Schedule[]> | null>(null);
const SchedulesDispatchContext = createContext<React.Dispatch<React.SetStateAction<Record<string, Schedule[]>>> | null>(null);

export const useSchedulesMap = () => {
  const schedulesMap = useContext(SchedulesStateContext);
  if (schedulesMap === null) {
    throw new Error('useSchedulesMap must be used within a ScheduleProvider');
  }
  return schedulesMap;
}

export const useSetSchedulesMap = () => {
  const setSchedulesMap = useContext(SchedulesDispatchContext);
  if (setSchedulesMap === null) {
    throw new Error('useSetSchedulesMap must be used within a ScheduleProvider');
  }
  return setSchedulesMap;
}

export const ScheduleProvider = ({ children }: PropsWithChildren) => {
  const [schedulesMap, setSchedulesMap] = useState<Record<string, Schedule[]>>(dummyScheduleMap);

  return (
    <SchedulesStateContext.Provider value={schedulesMap}>
      <SchedulesDispatchContext.Provider value={setSchedulesMap}>
        {children}
      </SchedulesDispatchContext.Provider>
    </SchedulesStateContext.Provider>
  );
};
