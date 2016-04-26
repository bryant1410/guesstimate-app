/* @flow */

import _ from 'lodash';
import async from 'async'

import e from 'gEngine/engine';
import type {Simulation, Graph} from '../lib/engine/types.js'
import {deleteSimulations} from 'gModules/simulations/actions'
import MetricPropagation from './metric-propagation.js'

function isRecentPropagation(propagationId: number, simulation: Simulation) {
  return !_.has(simulation, 'propagation') || (propagationId >= simulation.propagation)
}

//TODO: Stop tree where there is an error
export class GraphPropagation {
  dispatch: Function;
  getState: Function;
  graphFilters: object;
  id: number;
  currentStep: number;
  steps: Array<any>;
  // metricId, samples

  constructor(dispatch: Function, getState: Function, graphFilters: object) {
    this.dispatch = dispatch
    this.getState = getState
    this.id = Date.now()

    this.spaceId = graphFilters.spaceId

    if (this.spaceId === undefined && graphFilters.metricId) {
      const metric = e.metric.get(getState().metrics, graphFilters.metricId)
      this.spaceId = metric && metric.space
    }

    this.useGuesstimateForm = graphFilters.useGuesstimateForm || false

    const orderedMetricIdsAndGraphErrors = this._orderedMetricIds(graphFilters)
    this.orderedMetricIds = orderedMetricIdsAndGraphErrors.map(m => m.id)
    this.orderedMetricPropagations = this.orderedMetricIds.map(id => (new MetricPropagation(id, this.id)))

    this.currentStep = 0

    const remainingPropagationSteps = this.orderedMetricPropagations.map(p => p.remainingSimulations.length)
    this.totalSteps = _.sum(remainingPropagationSteps)
  }

  run(): void {
    if (this.currentStep >= this.totalSteps) {
      return
    }
    this._step().then(() => {this.run()});
  }

  _step() {
    const i = (this.currentStep % this.orderedMetricIds.length)
    return this._simulateMetric(this.orderedMetricPropagations[i]).then(() => {this.currentStep++})
  }

  _simulateMetric(metricPropagation) {
    return metricPropagation.step(this._graph(), this.dispatch)
  }

  _graph(): Graph {
    const state = this.getState()
    let subset = e.space.subset(e.graph.create(state), this.spaceId)

    if (this.useGuesstimateForm) {
      subset = e.graph.toBizarroGraph(subset, state.guesstimateForm);
    }

    return subset
  }

  _orderedMetricIds(graphFilters: object): Array<Object> {
    if (graphFilters.onlyHead) { return [graphFilters.metricId]}
    this.dependencies = e.graph.dependencyTree(this._graph(), graphFilters)
    const inOrder = _.sortBy(this.dependencies, function(n){return n[1]}).map(e => ({
      id: e[0],
      infiniteLoop: _.isFinite(e[1])
    }))
    return inOrder
  }
}
