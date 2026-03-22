import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { BujoList, ListItem } from '../../types';
import './ListsPanel.css';

function DraggableItem({ item, listId }: { item: ListItem; listId: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `list-item-${item.id}`,
    data: { itemId: item.id, listId, content: item.content },
  });

  return (
    <div
      ref={setNodeRef}
      className={`lists-panel__item${isDragging ? ' lists-panel__item--dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <span className="lists-panel__item-grip">⠿</span>
      <span className="lists-panel__item-content">{item.content}</span>
    </div>
  );
}

interface Props {
  open: boolean;
  lists: BujoList[];
  onClose: () => void;
  onAddList: (name: string) => void;
  onRemoveList: (listId: string) => void;
  onRenameList: (listId: string, name: string) => void;
  onAddItem: (listId: string, content: string) => void;
  onRemoveItem: (listId: string, itemId: string) => void;
}

export function ListsPanel({
  open,
  lists,
  onClose,
  onAddList,
  onRemoveList,
  onAddItem,
}: Props) {
  const [newListName, setNewListName] = useState('');
  const [newItems, setNewItems] = useState<Record<string, string>>({});

  if (!open) return null;

  return (
    <div className="lists-panel">
      <div className="lists-panel__backdrop" onClick={onClose} />
      <div className="lists-panel__drawer">
        <div className="lists-panel__header">
          <span className="lists-panel__title">Lists</span>
          <button className="lists-panel__close" onClick={onClose}>×</button>
        </div>

        <div className="lists-panel__body">
          {lists.map((list) => (
            <div key={list.id} className="lists-panel__list">
              <div className="lists-panel__list-header">
                <span className="lists-panel__list-name">{list.name}</span>
                <button
                  className="lists-panel__list-remove"
                  onClick={() => onRemoveList(list.id)}
                >
                  ×
                </button>
              </div>

              {list.items.map((item) => (
                <DraggableItem key={item.id} item={item} listId={list.id} />
              ))}

              <input
                className="lists-panel__item-input"
                placeholder="+ add item"
                value={newItems[list.id] ?? ''}
                onChange={(e) => setNewItems((p) => ({ ...p, [list.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (newItems[list.id] ?? '').trim();
                    if (val) {
                      onAddItem(list.id, val);
                      setNewItems((p) => ({ ...p, [list.id]: '' }));
                    }
                  }
                }}
              />
            </div>
          ))}

          <input
            className="lists-panel__new-list"
            placeholder="+ new list"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = newListName.trim();
                if (val) {
                  onAddList(val);
                  setNewListName('');
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
