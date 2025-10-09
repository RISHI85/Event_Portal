import useUiStore from '../store/uiStore';

export async function fetchWithLoading(input, init) {
  try {
    useUiStore.getState().incrementLoading();
    const res = await fetch(input, init);
    return res;
  } finally {
    try { useUiStore.getState().decrementLoading(); } catch {}
  }
}

export default fetchWithLoading;
