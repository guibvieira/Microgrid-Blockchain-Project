import React, { Component } from 'react';
import { Form, Input, Message, Button } from 'semantic-ui-react';
import web3 from '../ethereum/web3';
import factory from '../ethereum/factory';
import exchange from '../ethereum/exchange';
import { Router } from '../routes';
import Household from '../ethereum/household';

class HouseholdForm extends Component {

    state = {
        errorMessage: '',
        loading: false,
        batteryCapacity: 0
    };

    createHousehold = async (event) => {
        event.preventDefault();

        this.setState( { errorMessage: '', loading: true});

        console.log(this.state.loading);

        try {
            const accounts = await web3.eth.getAccounts();
            console.log('accounts', accounts);
            await factory.methods.createHousehold('5000').send({
                from: accounts[0],
                gas: '1000000'
            });

            let households = this.props.households;
            // console.log('im here');
            // const households = await factory.methods.getDeployedHouseholds().call();
            console.log('household address created'. households);
            console.log('household address created'. households[households.length - 1]);
            const household = Household(households[households.length - 1])
            
    
            await household.methods.setExchange(exchange.options.address).send({
                from: accounts[0],
                gas: '100000'
            });

            Router.replaceRoute('/');
        } catch (err) {
            this.setState({errorMessage: err.message})
        }
        
        this.setState({loading: false});
    }

    onInputChanged(event) {
        this.setState({ minimumContribution: event.target.value });
        console.log(this.state);
    }

    render() {
        return (

        <Form onSubmit={this.createHousehold} error={!!this.state.errorMessage}>
         <Form.Field>
           <label>Battery Capacity</label>
           <Input
             type='number'
             size='mini'
             label='W/h'
             labelPosition='right'
              onChange={ event => this.onInputChanged(event)}
           />
         </Form.Field>

         <Message error header='Oops!' content={this.state.errorMessage} />
         <Button style={{ marginTop: '2px', marginBottom: '30px' }} loading={this.state.loading} primary>
           Create!
         </Button>
       </Form>
        );
    }
}

export default HouseholdForm;