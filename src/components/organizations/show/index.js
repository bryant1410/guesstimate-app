import React, {Component, PropTypes} from 'react'
import { connect } from 'react-redux';
import SpaceList from 'gComponents/spaces/list'
import * as spaceActions from 'gModules/spaces/actions'
import * as organizationActions from 'gModules/organizations/actions'
import * as userOrganizationMembershipActions from 'gModules/userOrganizationMemberships/actions.js'
import { organizationSpaceSelector } from './organizationSpaceSelector.js';
import { organizationMemberSelector } from './organizationMemberSelector.js';
import SpaceCards from 'gComponents/spaces/cards'
import Container from 'gComponents/utility/container/Container.js'
import e from 'gEngine/engine'
import './style.css'
import Icon from 'react-fa'

function mapStateToProps(state) {
  return {
    me: state.me,
    organizations: state.organizations,
  }
}

const Member = ({user, isAdmin, onRemove}) => (
  <div className='member'>
    <div className='row'>
      <div className='col-xs-7'>
        <a href={e.user.url(user)}><img src={user.picture}/></a>
        <a href={e.user.url(user)} className='member--name'>{user.name}</a>
      </div>
      <div className='col-xs-2 role'>
        {isAdmin ? 'Admin' : 'Editor'}
      </div>
      <div className='col-xs-3'>
        {user.membershipId && !isAdmin &&
          <button className='ui button small remove' onClick={onRemove}>
            Remove
          </button>
        }
      </div>
    </div>
  </div>
)

@connect(mapStateToProps)
@connect(organizationSpaceSelector)
@connect(organizationMemberSelector)
export default class OrganizationShow extends Component{
  displayName: 'OrganizationShow'

  state = {
    attemptedFetch: false,
    openTab: 'MEMBERS',
    subMembersTab: 'INDEX'
  }

  componentWillMount() {
    this.considerFetch(this.props)
  }

  componentDidUpdate(newProps) {
    this.considerFetch(newProps)
  }

  considerFetch(props) {
    const needsData = !(_.has(props, 'organizationSpaces') && props.organizationSpaces.length > 0)

    if (needsData) {
      this.fetchData()
    }
  }

  fetchData() {
    if (!this.state.attemptedFetch) {
      this.props.dispatch(organizationActions.fetchById(this.props.organizationId))
      this.props.dispatch(spaceActions.fetch({organizationId: this.props.organizationId}))
      this.setState({attemptedFetch: true})
    }
  }

  changeTab(tab) {
    this.setState({openTab: tab})
  }

  destroyMembership(user) {
     this.props.dispatch(userOrganizationMembershipActions.destroy(user.membershipId))
  }

  addUser() {
     this.props.dispatch(organizationActions.addMember(this.props.organizationId, 'foo@bar.com'))
  }

  render () {
    const {organizationId, organizations, members} = this.props
    const {openTab} = this.state
    const spaces =  _.orderBy(this.props.organizationSpaces.asMutable(), ['updated_at'], ['desc'])
    const organization = organizations.find(u => u.id.toString() === organizationId.toString())

    return (
      <Container>
        <div className='organizationShow'>
          <div className='GeneralSpaceIndex'>

            <div className='row'>
              <div className='col-md-4'/>
              <div className='col-md-4 col-xs-12'>
                {organization &&
                  <div className='col-sm-12'>
                    <div className='main-organization-tag'>
                      <img
                        src={organization.picture}
                      />
                      <h1>
                        {organization.name}
                      </h1>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div className='row'>
              <div className='col-xs-12'>
                <div className="ui secondary menu">
                  { [{name: 'Members', key: 'MEMBERS'}, {name: 'Models', key: 'MODELS'}].map( e => {
                    const className = `item ${(openTab === e.key) ? 'active' : ''}`
                    return (
                      <a className={className} onClick={() => {this.changeTab(e.key)}}> {e.name} </a>
                    )
                   })}
                </div>
              </div>
            </div>

            <div className='main-section'>
              {(openTab === 'MODELS') && spaces &&
                <SpaceCards
                  spaces={spaces}
                  showPrivacy={true}
                />
              }

              {(openTab === 'MEMBERS') && members && organization &&
                <MembersTab
                  subTab={this.state.subMembersTab}
                  members={members}
                  admin_id={organization.admin_id}
                  onRemove={this.destroyMembership}
                  addUser={this.addUser.bind(this)}
                  changeSubTab={(name) => {this.setState({subMembersTab: name})}}
                />
              }
            </div>
          </div>
        </div>
      </Container>
    )
  }
}

const MembersTab = ({subTab, members, admin_id, onRemove, addUser, changeSubTab}) => (
  <div className='row'>
    <div className='col-sm-2'>
          <div className='ui button large green' onClick={() => {changeSubTab('ADD')}}>
            <Icon name='plus'/>Add Users
          </div>
        </div>
    <div className='col-sm-8'>
      {subTab === 'INDEX' &&
        <div>
          <div className='members'>
            {members.map(m => {
              return (
                <Member
                  key={m.id}
                  user={m}
                  isAdmin={admin_id === m.id}
                  onRemove={() => {onRemove(m)}}
                />
                )
            })}
          </div>

        </div>
      }
      {subTab === 'ADD' &&
        <div>
          <h1> Invite New Members </h1>
          <h3> Members have viewing & editing access to all organization models.</h3>

          <div onClick={() => {changeSubTab('INDEX')}}> close </div>

        <div className="ui form">
          <div className="field">
            <label>Email</label>
            <input type="text" placeholder="name@domain.com"/>
          </div>
        </div>

        </div>
      }
    </div>
  </div>
)

