import { Button, ButtonGroup, Flex, Heading, Stack } from "@chakra-ui/react";
import ScheduleTable from "./ScheduleTable.tsx";
import { useSchedulesMap, useSetSchedulesMap } from "./ScheduleContext.tsx";
import SearchDialog from "./SearchDialog.tsx";
import { memo, useCallback, useState } from "react";
import ScheduleDndProvider from "./ScheduleDndProvider.tsx";

const MemoizedScheduleTable = memo(ScheduleTable);

const ScheduleHeader = memo(({
  index,
  tableId,
  disabledRemoveButton,
  onAdd,
  onDuplicate,
  onRemove,
}: {
  index: number, tableId: string, disabledRemoveButton: boolean,
  onAdd: (tableId: string) => void,
  onDuplicate: (tableId: string) => void,
  onRemove: (tableId: string) => void,
}) => {
  const handleAdd = useCallback(() => onAdd(tableId), [onAdd, tableId]);
  const handleDuplicate = useCallback(() => onDuplicate(tableId), [onDuplicate, tableId]);
  const handleRemove = useCallback(() => onRemove(tableId), [onRemove, tableId]);

  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Heading as="h3" fontSize="lg">시간표 {index + 1}</Heading>
      <ButtonGroup size="sm" isAttached>
        <Button colorScheme="green" onClick={handleAdd}>시간표 추가</Button>
        <Button colorScheme="green" mx="1px" onClick={handleDuplicate}>복제</Button>
        <Button colorScheme="green" isDisabled={disabledRemoveButton}
                onClick={handleRemove}>삭제</Button>
      </ButtonGroup>
    </Flex>
  )
});

export const ScheduleTables = () => {
  const schedulesMap = useSchedulesMap();
  const setSchedulesMap = useSetSchedulesMap();
  const [searchInfo, setSearchInfo] = useState<{
    tableId: string;
    day?: string;
    time?: number;
  } | null>(null);

  const disabledRemoveButton = Object.keys(schedulesMap).length === 1;

  const duplicate = useCallback((targetId: string) => {
    setSchedulesMap(prev => ({
      ...prev,
      [`schedule-${Date.now()}`]: [...prev[targetId]]
    }))
  }, [setSchedulesMap]);

  const remove = useCallback((targetId: string) => {
    setSchedulesMap(prev => {
      const newSchedulesMap = { ...prev };
      delete newSchedulesMap[targetId];
      return newSchedulesMap;
    })
  }, [setSchedulesMap]);

  const onAdd = useCallback((tableId: string) => {
    setSearchInfo({ tableId });
  }, []);

  const onDeleteButtonClick = useCallback((tableId: string, { day, time }: { day: string, time: number }) => {
    setSchedulesMap((prev) => ({
      ...prev,
      [tableId]: prev[tableId].filter(schedule => schedule.day !== day || !schedule.range.includes(time))
    }));
  }, [setSchedulesMap]);

  const onScheduleTimeClick = useCallback((tableId: string, timeInfo: { day: string, time: number }) => {
    setSearchInfo({ tableId, ...timeInfo });
  }, []);

  return (
    <>
      <Flex w="full" gap={6} p={6} flexWrap="wrap">
        {Object.entries(schedulesMap).map(([tableId, schedules], index) => (
          <Stack key={tableId} width="600px">
            <ScheduleHeader
              index={index}
              tableId={tableId}
              onAdd={onAdd}
              onDuplicate={duplicate}
              onRemove={remove}
              disabledRemoveButton={disabledRemoveButton}
            />
            <ScheduleDndProvider>
              <MemoizedScheduleTable
                schedules={schedules}
                tableId={tableId}
                onScheduleTimeClick={onScheduleTimeClick}
                onDeleteButtonClick={onDeleteButtonClick}
              />
            </ScheduleDndProvider>
          </Stack>
        ))}
      </Flex>
      <SearchDialog searchInfo={searchInfo} onClose={() => setSearchInfo(null)}/>
    </>
  );
}
