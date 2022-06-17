import { useEffect } from 'react';
import { Observer, ReplaySubject, Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { AbsoluteTimeRange, toUtc, useObservable } from '@grafana/data';

import {
  SceneComponentProps,
  SceneTimeRangeState,
  SceneDataState,
  SceneObject,
  SceneLayoutState,
  SceneObjectState,
} from './types';

export abstract class SceneObjectBase<TState extends SceneObjectState> implements SceneObject<TState> {
  subject = new ReplaySubject<TState>();
  state: TState;
  parent?: SceneObjectBase<any>;
  subs = new Subscription();
  isMounted?: boolean;

  constructor(state: TState) {
    if (!state.key) {
      state.key = uuidv4();
    }

    this.state = state;
    this.subject.next(state);
    this.setParent();
  }

  private setParent() {
    for (const propValue of Object.values(this.state)) {
      if (propValue instanceof SceneObjectBase) {
        propValue.parent = this;
      }
    }

    const children = (this.state as any).children as Array<SceneObjectBase<any>>;
    if (children) {
      for (const child of children) {
        child.parent = this;
      }
    }
  }

  subscribe(observer: Partial<Observer<TState>>) {
    return this.subject.subscribe(observer);
  }

  setState(state: Partial<TState>) {
    this.state = {
      ...this.state,
      ...state,
    };
    this.setParent();
    this.subject.next(this.state);
  }

  Component(_: SceneComponentProps<SceneObject<TState>>): React.ReactElement | null {
    return null;
  }

  onMount() {
    this.isMounted = true;

    const { $data } = this.state;
    if ($data && !$data.isMounted) {
      $data.onMount();
    }
  }

  onUnmount() {
    this.isMounted = false;

    const { $data } = this.state;
    if ($data && $data.isMounted) {
      $data.onUnmount();
    }

    this.subs.unsubscribe();
  }

  /**
   * The scene object needs to know when the react component is mounted to trigger query and other lazy actions
   */
  useMount() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (!this.isMounted) {
        this.onMount();
      }
      return () => {
        if (this.isMounted) {
          this.onUnmount();
        }
      };
    }, []);

    return this;
  }

  useState() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useObservable(this.subject, this.state);
  }

  /**
   * Will walk up the scene object graph to the closest $timeRange scene object
   */
  getTimeRange(): SceneObject<SceneTimeRangeState> {
    const { $timeRange } = this.state;
    if ($timeRange) {
      return $timeRange;
    }

    if (this.parent) {
      return this.parent.getTimeRange();
    }

    throw new Error('No time range found in scene tree');
  }

  /**
   * Will walk up the scene object graph to the closest $data scene object
   */
  getData(): SceneObject<SceneDataState> {
    const { $data } = this.state;
    if ($data) {
      return $data;
    }

    if (this.parent) {
      return this.parent.getData();
    }

    throw new Error('No data found in scene tree');
  }

  onSetTimeRange = (timeRange: AbsoluteTimeRange) => {
    const sceneTimeRange = this.getTimeRange();
    sceneTimeRange.setState({
      timeRange: {
        raw: {
          from: toUtc(timeRange.from),
          to: toUtc(timeRange.to),
        },
        from: toUtc(timeRange.from),
        to: toUtc(timeRange.to),
      },
    });
  };

  /**
   * Will create new SceneItem with shalled cloned state, but all states items of type SceneItem are deep cloned
   */
  clone(withState?: Partial<TState>): this {
    const clonedState = { ...this.state };

    // Clone any SceneItems in state
    for (const key in clonedState) {
      const propValue = clonedState[key];
      if (propValue instanceof SceneObjectBase) {
        clonedState[key] = propValue.clone();
      }
    }

    // Clone layout children
    const layout = this.state as any as SceneLayoutState;
    if (layout.children) {
      const newChildren: SceneLayoutState['children'] = [];
      for (const child of layout.children) {
        newChildren.push(child.clone());
      }
      (clonedState as any).children = newChildren;
    }

    Object.assign(clonedState, withState);

    return new (this.constructor as any)(clonedState);
  }
}