import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DropResult } from "react-beautiful-dnd";
import { v4 } from "uuid";

import boardsApi, { Board } from "./api/boards";
import { positionIndexedItem } from "../lib/positionIndexedItem";

export interface BoardState extends Board {
  addingOnList?: string;
  error?: string;
  loading:boolean
}

const initialState: BoardState = {
  lists: {},
  loading: false
};

export const fetchBoards = createAsyncThunk("boards/fetch", boardsApi.fetchBoards);

const boardDetailsSlice = createSlice({
  name: "boardDetails",
  initialState,
  reducers: {
    startAdd(state, action: PayloadAction<string>) {
      state.addingOnList = action.payload;
    },
    cancelAdd(state) {
      state.addingOnList = undefined;
    },
    confirmAdd(state, action: PayloadAction<string>) {
      const newId = v4();
      const targetList = state.lists[state.addingOnList!];
      state.addingOnList = undefined;
      targetList.cards[newId] = {
        id: newId,
        text: action.payload,
        index: Object.keys(targetList).length,
      };
    },
    dragEnd(state, action: PayloadAction<DropResult>) {
      if (!action.payload.destination) {
        return state;
      }

      const targetListId = action.payload.destination.droppableId;
      const targetIndex = action.payload.destination.index;

      const sourceListId = action.payload.source.droppableId;
      const sourceItem =
        state.lists[sourceListId].cards[action.payload.draggableId];

      if (sourceListId !== targetListId) {
        delete state.lists[sourceListId].cards[sourceItem.id];
      }

      const updatedCards = positionIndexedItem(
        state.lists[targetListId].cards,
        sourceItem,
        targetIndex
      );

      state.lists[targetListId].cards = updatedCards;
    },
  },
  extraReducers: {
    [fetchBoards.fulfilled.toString()]: (
      state,
      action: PayloadAction<Board[]>
    ) => {
      state.lists = action.payload[0].lists;
      state.loading = false
    },
    [fetchBoards.rejected.toString()]: (
      state,
      action: PayloadAction<string>
    ) => {
      state.error = 'Error while loading board data';
      state.loading = false
    },
    [fetchBoards.pending.toString()]: (
      state,
      action: PayloadAction<string>
    ) => {
      state.loading = true;
    },
  },
});

export const actions = { ...boardDetailsSlice.actions, fetchBoards };

export default boardDetailsSlice.reducer;
