import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { BujoList, ListItem } from '../../types';
import './ListsView.css';

function DraggableItem({
  item,
  listId,
  onToggle,
  onRemove,
}: {
  item: ListItem;
  listId: string;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `list-item-${item.id}`,
    data: { itemId: item.id, listId, content: item.content },
  });

  const done = item.status === 'completed';

  return (
    <div
      ref={setNodeRef}
      className={`lists-view__item${isDragging ? ' lists-view__item--dragging' : ''}${done ? ' lists-view__item--done' : ''}`}
    >
      <span
        className="lists-view__item-grip"
        {...listeners}
        {...attributes}
        title="Drag to a day to schedule"
      >⠿</span>
      <button className="lists-view__item-signifier" onClick={onToggle} title="Toggle complete">
        {done ? '●' : '○'}
      </button>
      <span className="lists-view__item-content">{item.content}</span>
      <button className="lists-view__item-remove" onClick={onRemove} title="Remove item">×</button>
    </div>
  );
}

interface Props {
  lists: BujoList[];
  onClose: () => void;
  onAddList: (name: string) => void;
  onRemoveList: (listId: string) => void;
  onRenameList: (listId: string, name: string) => void;
  onAddItem: (listId: string, content: string) => void;
  onRemoveItem: (listId: string, itemId: string) => void;
  onToggleItem: (listId: string, itemId: string) => void;
}

export function ListsView({
  lists,
  onClose,
  onAddList,
  onRemoveList,
  onRenameList,
  onAddItem,
  onRemoveItem,
  onToggleItem,
}: Props) {
  const [selectedListId, setSelectedListId] = useState<string | null>(lists[0]?.id ?? null);
  const [newListName, setNewListName] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const selectedList = lists.find((l) => l.id === selectedListId) ?? null;
  const openItems = selectedList?.items.filter((i) => i.status === 'open') ?? [];
  const doneItems = selectedList?.items.filter((i) => i.status === 'completed') ?? [];

  function handleAddList(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return;
    const name = newListName.trim();
    if (!name) return;
    onAddList(name);
    setNewListName('');
  }

  function handleAddItem(e: React.KeyboardEvent) {
    if (e.key !== 'Enter' || !selectedListId) return;
    const content = newItemContent.trim();
    if (!content) return;
    onAddItem(selectedListId, content);
    setNewItemContent('');
  }

  function startRename(list: BujoList) {
    setEditingListId(list.id);
    setEditingName(list.name);
  }

  function commitRename() {
    if (editingListId && editingName.trim()) {
      onRenameList(editingListId, editingName.trim());
    }
    setEditingListId(null);
  }

  return (
    <div className="lists-view">
      <div className="lists-view__sidebar">
        <div className="lists-view__sidebar-header">
          <span className="lists-view__sidebar-title">Lists</span>
          <button className="lists-view__close" onClick={onClose} title="Close">×</button>
        </div>

        <nav className="lists-view__nav">
          {lists.map((list) => (
            <div
              key={list.id}
              className={`lists-view__nav-item${list.id === selectedListId ? ' lists-view__nav-item--active' : ''}`}
              onClick={() => setSelectedListId(list.id)}
            >
              {editingListId === list.id ? (
                <input
                  className="lists-view__rename-input"
                  value={editingName}
                  autoFocus
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className="lists-view__nav-name" onDoubleClick={() => startRename(list)}>
                    {list.name}
                  </span>
                  <span className="lists-view__nav-count">
                    {list.items.filter((i) => i.status === 'open').length}
                  </span>
                </>
              )}
            </div>
          ))}
        </nav>

        <div className="lists-view__sidebar-footer">
          <input
            className="lists-view__new-list-input"
            placeholder="+ new list"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={handleAddList}
          />
        </div>
      </div>

      <div className="lists-view__detail">
        {selectedList ? (
          <>
            <div className="lists-view__detail-header">
              <h2 className="lists-view__detail-title">{selectedList.name}</h2>
              <div className="lists-view__detail-meta">
                {openItems.length} open · {doneItems.length} done
              </div>
              <button
                className="lists-view__delete-list"
                onClick={() => {
                  onRemoveList(selectedList.id);
                  setSelectedListId(lists.find((l) => l.id !== selectedList.id)?.id ?? null);
                }}
                title="Delete list"
              >
                Delete list
              </button>
            </div>

            <div className="lists-view__items">
              {openItems.map((item) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  listId={selectedList.id}
                  onToggle={() => onToggleItem(selectedList.id, item.id)}
                  onRemove={() => onRemoveItem(selectedList.id, item.id)}
                />
              ))}

              <div className="lists-view__add-item">
                <input
                  className="lists-view__add-item-input"
                  placeholder="+ add item"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  onKeyDown={handleAddItem}
                />
              </div>

              {doneItems.length > 0 && (
                <div className="lists-view__done-section">
                  <div className="lists-view__done-label">Completed</div>
                  {doneItems.map((item) => (
                    <DraggableItem
                      key={item.id}
                      item={item}
                      listId={selectedList.id}
                      onToggle={() => onToggleItem(selectedList.id, item.id)}
                      onRemove={() => onRemoveItem(selectedList.id, item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="lists-view__empty">
            <p>No lists yet. Create one on the left.</p>
          </div>
        )}
      </div>
    </div>
  );
}
