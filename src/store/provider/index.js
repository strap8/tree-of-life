import React, { createContext, useMemo, useReducer, useEffect } from 'react'
import PropTypes from 'prop-types'
import { combineReducers, isAFunction } from '../utils'

const storeFactory = () => ({
  isReady: false,
  dispatch: () => {
    console.error('Store is NOT ready!')
  },
  getState: () => {
    console.error('Store is NOT ready!')
  },
})

const StateProvider = createContext({})

const defaultInitializer = state => state

const store = storeFactory()

// This allows actions to dispatch other actions and pass (dispatch, getState)
const augmentDispatch = (dispatch, state) => input => {
  const getState = () => state
  return isAFunction(input) ? input(dispatch, getState) : dispatch(input)
}

const ContextProvider = ({ reducers, initialState, initializer, children }) => {
  // call the function to get initial state and global reducer
  const [mainState, mainReducer] = useMemo(() => combineReducers(reducers, initialState), [
    reducers,
    initialState,
  ])

  // setup useReducer with the returned values of the combineReducers
  const [state, dispatch] = useReducer(mainReducer, mainState, initializer)

  const augmentedDispatch = useMemo(() => augmentDispatch(dispatch, state), [state])

  // Update store object to potentially access it outside of a component
  useEffect(() => {
    if (!store.isReady) {
      store.isReady = true
      store.dispatch = augmentedDispatch
      store.getState = () => state
      // Object.freeze(store) // don't freeze the object, or store.isReady can't be re-assigned
    }
    return () => {
      store.isReady = false
    }
  }, [augmentedDispatch])

   // make our context object value
  const contextValue = useMemo(() => ({ state, dispatch: augmentedDispatch }), [
    state,
    augmentedDispatch,
  ])

  return <StateProvider.Provider value={contextValue}>{children}</StateProvider.Provider>
}

ContextProvider.propTypes = {
  reducers: PropTypes.oneOfType([PropTypes.objectOf(PropTypes.func.isRequired), PropTypes.func])
    .isRequired,
  initialState: PropTypes.object,
  initializer: PropTypes.func,
  persistKey: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
}

ContextProvider.defaultProps = {
  initializer: defaultInitializer,
}

export { ContextProvider, StateProvider as ContextConsumer, store, storeFactory }
