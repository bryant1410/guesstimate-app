import React, {Component, PropTypes} from 'react'
import FirstSubscription from './FirstSubscription.js'
import ComponentEditor from 'gComponents/utility/ComponentEditor/index.js'
import {subStages} from 'gModules/first_subscription/state_machine'

const FirstSubscriptionBaseProps = {
  planId: 'small',
  paymentAccountPortalUrl: 'http://foobar.com',
  iframeUrl: 'http://foobar.com',
  iframeWebsiteName: 'good-stuff',
  onPaymentCancel: function(g) { console.log(g) },
  onPaymentSuccess: function(g) { console.log(g) }
}

function FirstSubscriptionStage(stage){
  return Object.assign({}, FirstSubscriptionBaseProps, {flowStage: stage})
}

export default class FirstSubscriptionStyleGuide extends Component{
  displayName: 'ComponentEditor-StyleGuide'
  render () {
    return (
      <div className='container-fluid full-width'>
        {
          subStages.map(flowStage => {
            return (
              <ComponentEditor
                  child={FirstSubscription}
                  childProps={ FirstSubscriptionStage(flowStage)}
                  name={`FirstSubscription:: ${flowStage}`}
              />
            )
          })
        }
      </div>
    )
  }
}
