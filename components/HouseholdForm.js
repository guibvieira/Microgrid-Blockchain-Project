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
        
            console.log('household address created', this.props.households[this.props.households.length - 1]);
            const household = Household(this.props.households[this.props.households.length-1])
            /*
            //put a pop up to warn that second transaction will be to set up the exchange
            */
            await household.methods.setExchange(exchange.options.address).send({
                from: accounts[0],
                gas: '100000'
            });

            Router.replaceRoute('/');
        } catch (err) {
            this.setState({errorMessage: err.message})
            console.log('catch',this.props);
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