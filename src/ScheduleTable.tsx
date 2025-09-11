import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import { CellSize, DAY_LABELS, 분 } from "./constants.ts";
import { Schedule } from "./types.ts";
import { fill2, parseHnM } from "./utils.ts";
import { useDndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ComponentProps, Fragment, memo, useCallback } from "react";

interface Props {
  tableId: string;
  schedules: Schedule[];
  onScheduleTimeClick?: (tableId: string, timeInfo: { day: string, time: number }) => void;
  onDeleteButtonClick?: (tableId: string, timeInfo: { day: string, time: number }) => void;
}

const TIMES = [
  ...Array(18)
    .fill(0)
    .map((v, k) => v + k * 30 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 30 * 분)}`),

  ...Array(6)
    .fill(18 * 30 * 분)
    .map((v, k) => v + k * 55 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 50 * 분)}`),
] as const;

const ScheduleGridHeader = memo(() => {
  return (
    <>
      <GridItem key="교시" borderColor="gray.300" bg="gray.100">
        <Flex justifyContent="center" alignItems="center" h="full" w="full">
          <Text fontWeight="bold">교시</Text>
        </Flex>
      </GridItem>
      {DAY_LABELS.map((day) => (
        <GridItem key={day} borderLeft="1px" borderColor="gray.300" bg="gray.100">
          <Flex justifyContent="center" alignItems="center" h="full">
            <Text fontWeight="bold">{day}</Text>
          </Flex>
        </GridItem>
      ))}
    </>
  )
});

const MemoizedTimeLabelCell = memo(({
  timeIndex,
  time,
  ...props
}: ComponentProps<typeof GridItem> & { timeIndex: number, time: string }) => {
  return (
    <GridItem
      borderTop="1px solid"
      borderColor="gray.300"
      bg={timeIndex > 17 ? 'gray.200' : 'gray.100'}
      {...props}
    >
      <Flex justifyContent="center" alignItems="center" h="full">
        <Text fontSize="xs">{fill2(timeIndex + 1)} ({time})</Text>
      </Flex>
    </GridItem>
  )
});

const MemoizedGridCell = memo(({
  tableId,
  day,
  timeIndex,
  onScheduleTimeClick,
  ...props
}: ComponentProps<typeof GridItem> & { tableId: string, day: string, timeIndex: number, onScheduleTimeClick?: Props['onScheduleTimeClick'] }) => {
  const handleClick = useCallback(() => {
    onScheduleTimeClick?.(tableId, { day, time: timeIndex + 1 });
  }, [tableId, day, timeIndex, onScheduleTimeClick]);

  return (
    <GridItem
      borderWidth="1px 0 0 1px"
      borderColor="gray.300"
      bg={timeIndex > 17 ? 'gray.100' : 'white'}
      cursor="pointer"
      _hover={{ bg: 'yellow.100' }}
      onClick={handleClick}
      {...props}
    />
  )
});

const ScheduleTableInner = memo(({ tableId, schedules, onScheduleTimeClick, onDeleteButtonClick }: Props) => {
  const getColor = (lectureId: string): string => {
    const lectures = [...new Set(schedules.map(({ lecture }) => lecture.id))];
    const colors = ["#fdd", "#ffd", "#dff", "#ddf", "#fdf", "#dfd"];
    return colors[lectures.indexOf(lectureId) % colors.length];
  };

  return (
    <>
      <Grid
        templateColumns={`120px repeat(${DAY_LABELS.length}, ${CellSize.WIDTH}px)`}
        templateRows={`40px repeat(${TIMES.length}, ${CellSize.HEIGHT}px)`}
        bg="white"
        fontSize="sm"
        textAlign="center"
        outline="1px solid"
        outlineColor="gray.300"
      >
        <ScheduleGridHeader />
        {TIMES.map((time, timeIndex) => (
          <Fragment key={`시간-${timeIndex + 1}`}>
            <MemoizedTimeLabelCell time={time} timeIndex={timeIndex}/>
            {DAY_LABELS.map((day) => (
              <MemoizedGridCell
                key={`${day}-${timeIndex + 2}`}
                tableId={tableId}
                day={day}
                timeIndex={timeIndex}
                onScheduleTimeClick={onScheduleTimeClick}
              />
            ))}
          </Fragment>
        ))}
      </Grid>

      {schedules.map((schedule, index) => (
        <DraggableSchedule
          key={`${schedule.lecture.title}-${index}`}
          id={`${tableId}:${index}`}
          data={schedule}
          bg={getColor(schedule.lecture.id)}
          tableId={tableId}
          onDeleteButtonClick={onDeleteButtonClick}
        />
      ))}
    </>
  )
});

const ScheduleTable = (props: Props) => {
  const { tableId } = props;
  const dndContext = useDndContext();

  const getActiveTableId = () => {
    const activeId = dndContext.active?.id;
    if (activeId) {
      return String(activeId).split(":")[0];
    }
    return null;
  }

  const activeTableId = getActiveTableId();

  return (
    <Box
      position="relative"
      outline={activeTableId === tableId ? "5px dashed" : undefined}
      outlineColor="blue.300"
    >
      <ScheduleTableInner {...props} />
    </Box>
  );
};

const DraggableSchedule = memo(({
 id,
 data,
 bg,
 tableId,
 onDeleteButtonClick
}: { id: string; data: Schedule, tableId: string, onDeleteButtonClick?: Props['onDeleteButtonClick'] } & ComponentProps<typeof Box>) => {
  const { day, range, room, lecture } = data;
  const { attributes, setNodeRef, listeners, transform } = useDraggable({ id });
  const leftIndex = DAY_LABELS.indexOf(day as typeof DAY_LABELS[number]);
  const topIndex = range[0] - 1;
  const size = range.length;

  const handleDeleteButtonClick = useCallback(() => {
    onDeleteButtonClick?.(tableId, { day, time: range[0] });
  }, [day, onDeleteButtonClick, range, tableId]);

  return (
    <Popover>
      <PopoverTrigger>
        <Box
          position="absolute"
          left={`${120 + (CellSize.WIDTH * leftIndex) + 1}px`}
          top={`${40 + (topIndex * CellSize.HEIGHT + 1)}px`}
          width={(CellSize.WIDTH - 1) + "px"}
          height={(CellSize.HEIGHT * size - 1) + "px"}
          bg={bg}
          p={1}
          boxSizing="border-box"
          cursor="pointer"
          ref={setNodeRef}
          transform={CSS.Translate.toString(transform)}
          {...listeners}
          {...attributes}
        >
          <Text fontSize="sm" fontWeight="bold">{lecture.title}</Text>
          <Text fontSize="xs">{room}</Text>
        </Box>
      </PopoverTrigger>
      <PopoverContent onClick={event => event.stopPropagation()}>
        <PopoverArrow/>
        <PopoverCloseButton/>
        <PopoverBody>
          <Text>강의를 삭제하시겠습니까?</Text>
          <Button colorScheme="red" size="xs" onClick={handleDeleteButtonClick}>
            삭제
          </Button>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
});

export default ScheduleTable;
