import { useState, useEffect, useCallback, useMemo } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import './App.css';
import { Layout } from './components/Layout/Layout';
import { DayView } from './components/DayView/DayView';
import { WeekView } from './components/WeekView/WeekView';
import { MonthView } from './components/MonthView/MonthView';
import { QuarterView } from './components/QuarterView/QuarterView';
import { YearView } from './components/YearView/YearView';
import { TaskDetail } from './components/TaskDetail/TaskDetail';
import { MigrationFlow } from './components/MigrationFlow/MigrationFlow';
import { LoginPage } from './components/Auth/LoginPage';
import { DesignSystem } from './components/DesignSystem/DesignSystem';
import { ListsView } from './components/Lists/ListsView';
import { DayDropZone } from './components/Lists/DayDropZone';
import { useTasks } from './hooks/useTasks';
import { useHighlights } from './hooks/useHighlights';
import { useNavigation } from './hooks/useNavigation';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import { useGoogleCalendar } from './hooks/useGoogleCalendar';
import { useDayOrganization } from './hooks/useDayOrganization';
import { useLists } from './hooks/useLists';
import { useNotifications } from './hooks/useNotifications';
import { useYearMap } from './hooks/useYearMap';
import { YearMap } from './components/YearMap/YearMap';
import { today, yesterday, toWeekKey, toMonthKey, toQuarterKey, toYearKey, fromDateKey, fromWeekKey, fromMonthKey, formatDayHeader } from './utils/dates';

function App() {
  // Hash-based route for design system
  const [showDesignSystem, setShowDesignSystem] = useState(
    () => window.location.hash === '#/design-system'
  );

  useEffect(() => {
    const onHashChange = () => {
      setShowDesignSystem(window.location.hash === '#/design-system');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const { session, loading: authLoading, signIn, signUp, signOut, supabaseConfigured } = useAuth();


  const {
    days,
    setDays,
    getDay,
    addTask,
    updateTask,
    cycleTaskStatus,
    migrateTask,
    deleteTask,
    setMigrationComplete,
    getOpenTasksForDate,
    reorderTask,
    moveTask,
  } = useTasks();


  const {
    highlights,
    setHighlights,
    getHighlight,
    setHighlight,
    clearHighlight,
    setReflection,
  } = useHighlights();

  const {
    currentDate,
    currentZoom,
    setCurrentDate,
    setZoom,
    navigate,
    goToToday,
  } = useNavigation();

  const { syncStatus } = useSync({
    session,
    days,
    setDays,
    highlights,
    setHighlights,
  });

  // Lists
  const { lists, addList, removeList, renameList, addItem, removeItem, toggleItemStatus } = useLists();
  const [showLists, setShowLists] = useState(false);
  const [showYearMap, setShowYearMap] = useState(false);

  // Year Map
  const yearMap = useYearMap();
  const [draggingListItem, setDraggingListItem] = useState<{
    itemId: string; listId: string; content: string;
  } | null>(null);

  const outerSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const handleListDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);
    if (id.startsWith('list-item-')) {
      setDraggingListItem(event.active.data.current as { itemId: string; listId: string; content: string });
    }
  }, []);

  const handleListDragEnd = useCallback((event: DragEndEvent) => {
    const item = draggingListItem;
    setDraggingListItem(null);
    if (!item || !event.over) return;
    const overId = String(event.over.id);
    if (overId.startsWith('day-drop-')) {
      const date = overId.replace('day-drop-', '');
      addTask(date, item.content);
    }
  }, [draggingListItem, addTask]);

  // Day organization
  const dayOrg = useDayOrganization();

  // Google Calendar
  const gcal = useGoogleCalendar(session);

  // Fetch calendar events when viewing a day
  useEffect(() => {
    if (gcal.status === 'connected' && currentZoom === 'day') {
      gcal.fetchEvents(currentDate, currentDate);
    }
  }, [gcal.status, currentDate, currentZoom]); // eslint-disable-line react-hooks/exhaustive-deps

  // Task detail state
  const [selectedTask, setSelectedTask] = useState<{ date: string; taskId: string } | null>(null);

  // Collect all unique categories for autocomplete
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const dayData of Object.values(days)) {
      for (const task of dayData.tasks) {
        if (task.category) cats.add(task.category);
      }
    }
    return Array.from(cats).sort();
  }, [days]);

  // All tasks flat — for notification checks
  const allTasks = useMemo(() => Object.values(days).flatMap((d) => d.tasks), [days]);
  useNotifications(allTasks);

  // Migration flow state
  const [showMigration, setShowMigration] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);

  // Check if migration is needed on mount
  useEffect(() => {
    if (migrationChecked) return;
    const todayKey = today();
    const yesterdayKey = yesterday();
    const todayData = getDay(todayKey);
    const yesterdayTasks = getOpenTasksForDate(yesterdayKey);
    const yesterdayHighlight = getHighlight('day', yesterdayKey);

    if (!todayData.migrationComplete && (yesterdayTasks.length > 0 || yesterdayHighlight)) {
      setShowMigration(true);
    }
    setMigrationChecked(true);
  }, [migrationChecked, getDay, getOpenTasksForDate, getHighlight]);

  const handleMigrationComplete = useCallback(() => {
    setMigrationComplete(today());
    setShowMigration(false);
  }, [setMigrationComplete]);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="app app--loading">
        <p>loading...</p>
      </div>
    );
  }

  // Design system page (accessible without auth)
  if (showDesignSystem) {
    return (
      <div className="app">
        <main className="app-main">
          <DesignSystem />
        </main>
      </div>
    );
  }

  // Not authenticated (only gate if Supabase is configured)
  if (supabaseConfigured && !session) {
    return <LoginPage onSignIn={signIn} onSignUp={signUp} />;
  }

  // Migration flow overlay
  if (showMigration) {
    const todayKey = today();
    const yesterdayKey = yesterday();
    const openTasks = getOpenTasksForDate(yesterdayKey);
    const yesterdayHighlight = getHighlight('day', yesterdayKey);

    return (
      <div className="migration-overlay">
        <MigrationFlow
          yesterdayDate={yesterdayKey}
          todayDate={todayKey}
          openTasks={openTasks}
          yesterdayHighlight={yesterdayHighlight}
          onMigrateTask={(taskId) => migrateTask(yesterdayKey, taskId, todayKey)}
          onCompleteTask={(taskId) => updateTask(yesterdayKey, taskId, { status: 'completed' })}
          onCancelTask={(taskId) => updateTask(yesterdayKey, taskId, { status: 'cancelled' })}
          onReflect={(rating, note) => setReflection('day', yesterdayKey, rating, note)}
          onSetTodayHighlight={(content) => setHighlight('day', todayKey, content)}
          onComplete={handleMigrationComplete}
        />
      </div>
    );
  }

  // Main app
  const dayData = getDay(currentDate);
  const dayHighlight = getHighlight('day', currentDate);
  return (
    <DndContext
      sensors={outerSensors}
      onDragStart={handleListDragStart}
      onDragEnd={handleListDragEnd}
    >
    <Layout
      currentDate={currentDate}
      currentZoom={currentZoom}
      onZoomChange={setZoom}
      onNavigate={navigate}
      onGoToday={goToToday}
      onGoToDate={setCurrentDate}
      syncStatus={syncStatus}
      onSignOut={signOut}
      gcalStatus={gcal.status}
      gcalEnabled={gcal.enabled}
      onGcalConnect={gcal.connect}
      onGcalDisconnect={gcal.disconnect}
      onToggleLists={() => setShowLists((v) => !v)}
      listsOpen={showLists}
      yearMapOpen={showYearMap}
      onToggleYearMap={() => setShowYearMap((v) => !v)}
    >
      <>
          {showYearMap && (() => {
            const year = new Date(currentDate).getFullYear();
            return (
              <YearMap
                year={year}
                groups={yearMap.groups}
                calendars={yearMap.calendars}
                visibleEntries={yearMap.visibleEntries}
                onAddGroup={yearMap.addGroup}
                onRemoveGroup={yearMap.removeGroup}
                onToggleGroup={yearMap.toggleGroup}
                onAddCalendar={yearMap.addCalendar}
                onRemoveCalendar={yearMap.removeCalendar}
                onToggleCalendar={yearMap.toggleCalendar}
                onAddEntry={yearMap.addEntry}
                onRemoveEntry={yearMap.removeEntry}
              />
            );
          })()}

          {!showYearMap && currentZoom === 'day' && draggingListItem && (
            <DayDropZone date={currentDate} label={formatDayHeader(currentDate)} />
          )}

          {!showYearMap && currentZoom === 'day' && (
            <DayView
              dayData={dayData}
              highlight={dayHighlight}
              onAddTask={(content) => addTask(currentDate, content)}
              onCycleStatus={(taskId) => cycleTaskStatus(currentDate, taskId)}
              onUpdateTask={(taskId, updates) => updateTask(currentDate, taskId, updates)}
              onDeleteTask={(taskId) => deleteTask(currentDate, taskId)}
              onSetHighlight={(content, taskId) => setHighlight('day', currentDate, content, taskId)}
              onClearHighlight={() => clearHighlight('day', currentDate)}
              onReorderTask={(taskId, newOrder) => reorderTask(currentDate, taskId, newOrder)}
              onTaskClick={(taskId) => setSelectedTask({ date: currentDate, taskId })}
              calendarEvents={gcal.status === 'connected' ? gcal.getEventsForDate(currentDate) : undefined}
              calendarLoading={gcal.loadingEvents}
              orgData={dayOrg.getOrgForDate(currentDate)}
              onSetMode={(mode) => dayOrg.setMode(currentDate, mode)}
              onSetSessionTime={(minutes) => dayOrg.setSessionTime(currentDate, minutes)}
              onAddTaskToSession={(taskId) => dayOrg.addTaskToSession(currentDate, taskId)}
              onRemoveTaskFromSession={(taskId) => dayOrg.removeTaskFromSession(currentDate, taskId)}
              onReorderSession={(taskId, newIndex) => dayOrg.reorderSession(currentDate, taskId, newIndex)}
              onSetTaskBucket={(taskId, bucket) => dayOrg.setTaskBucket(currentDate, taskId, bucket)}
              onClearTaskBucket={(taskId) => dayOrg.clearTaskBucket(currentDate, taskId)}
            />
          )}

          {!showYearMap && currentZoom === 'week' && (() => {
            const weekKey = toWeekKey(fromDateKey(currentDate));
            return (
              <WeekView
                currentDate={currentDate}
                days={days}
                highlights={highlights}
                weekHighlight={getHighlight('week', weekKey)}
                weekKey={weekKey}
                onDayClick={(date) => {
                  setCurrentDate(date);
                  setZoom('day');
                }}
                onSetWeekHighlight={(content) => setHighlight('week', weekKey, content)}
                onClearWeekHighlight={() => clearHighlight('week', weekKey)}
                onAddWeekTask={(content) => addTask(weekKey, content)}
                onCycleDayTaskStatus={(date, taskId) => cycleTaskStatus(date, taskId)}
                onCycleWeekTaskStatus={(taskId) => cycleTaskStatus(weekKey, taskId)}
                onTaskClick={(dateKey, taskId) => setSelectedTask({ date: dateKey, taskId })}
                onMoveTaskToDay={(fromKey, taskId, toDate) => moveTask(fromKey, taskId, toDate)}
              />
            );
          })()}

          {!showYearMap && currentZoom === 'month' && (() => {
            const monthKey = toMonthKey(fromDateKey(currentDate));
            return (
              <MonthView
                currentDate={currentDate}
                days={days}
                highlights={highlights}
                monthHighlight={getHighlight('month', monthKey)}
                monthKey={monthKey}
                onDayClick={(date) => {
                  setCurrentDate(date);
                  setZoom('day');
                }}
                onSetMonthHighlight={(content) => setHighlight('month', monthKey, content)}
                onClearMonthHighlight={() => clearHighlight('month', monthKey)}
                onAddMonthTask={(content) => addTask(monthKey, content)}
                onCycleDayTaskStatus={(date, taskId) => cycleTaskStatus(date, taskId)}
                onCycleMonthTaskStatus={(taskId) => cycleTaskStatus(monthKey, taskId)}
                onTaskClick={(dateKey, taskId) => setSelectedTask({ date: dateKey, taskId })}
              />
            );
          })()}

          {!showYearMap && currentZoom === 'quarter' && (() => {
            const quarterKey = toQuarterKey(fromDateKey(currentDate));
            return (
              <QuarterView
                currentDate={currentDate}
                days={days}
                highlights={highlights}
                quarterHighlight={getHighlight('quarter', quarterKey)}
                quarterKey={quarterKey}
                onSetQuarterHighlight={(content) => setHighlight('quarter', quarterKey, content)}
                onClearQuarterHighlight={() => clearHighlight('quarter', quarterKey)}
                onAddQuarterTask={(content) => addTask(quarterKey, content)}
                onCycleQuarterTaskStatus={(taskId) => cycleTaskStatus(quarterKey, taskId)}
                onCycleWeekTaskStatus={(weekKey, taskId) => cycleTaskStatus(weekKey, taskId)}
                onCycleDayTaskStatus={(date, taskId) => cycleTaskStatus(date, taskId)}
                onTaskClick={(dateKey, taskId) => setSelectedTask({ date: dateKey, taskId })}
                onWeekClick={(weekKey) => {
                  setCurrentDate(fromWeekKey(weekKey));
                  setZoom('week');
                }}
              />
            );
          })()}

          {!showYearMap && currentZoom === 'year' && (() => {
            const yearKey = toYearKey(fromDateKey(currentDate));
            return (
              <YearView
                currentDate={currentDate}
                days={days}
                highlights={highlights}
                yearHighlight={getHighlight('year', yearKey)}
                yearKey={yearKey}
                onSetYearHighlight={(content) => setHighlight('year', yearKey, content)}
                onClearYearHighlight={() => clearHighlight('year', yearKey)}
                onAddYearTask={(content) => addTask(yearKey, content)}
                onCycleYearTaskStatus={(taskId) => cycleTaskStatus(yearKey, taskId)}
                onTaskClick={(dateKey, taskId) => setSelectedTask({ date: dateKey, taskId })}
                onMonthClick={(monthKey) => {
                  setCurrentDate(fromMonthKey(monthKey));
                  setZoom('month');
                }}
              />
            );
          })()}
      </>
      {selectedTask && (() => {
        const taskDay = getDay(selectedTask.date);
        const task = taskDay.tasks.find((t) => t.id === selectedTask.taskId);
        if (!task) return null;
        return (
          <TaskDetail
            task={task}
            allCategories={allCategories}
            onUpdate={(updates) => updateTask(selectedTask.date, selectedTask.taskId, updates)}
            onCycleStatus={() => cycleTaskStatus(selectedTask.date, selectedTask.taskId)}
            onDelete={() => {
              deleteTask(selectedTask.date, selectedTask.taskId);
              setSelectedTask(null);
            }}
            onClose={() => setSelectedTask(null)}
          />
        );
      })()}
    </Layout>

    {showLists && (
      <ListsView
        lists={lists}
        onClose={() => setShowLists(false)}
        onAddList={addList}
        onRemoveList={removeList}
        onRenameList={renameList}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onToggleItem={toggleItemStatus}
      />
    )}

    <DragOverlay>
      {draggingListItem ? (
        <div className="task-item task-item--overlay">
          <span className="task-item__signifier">◦</span>
          <span className="task-item__content">{draggingListItem.content}</span>
        </div>
      ) : null}
    </DragOverlay>
    </DndContext>
  );
}

export default App;
