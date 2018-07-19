import React, { Component } from 'react';
import { Form, Input, Message, Button } from 'semantic-ui-react';
import web3 from '../ethereum/web3';
// import { Router } from '../routes';

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
        } catch (err) {
            this.setState({errorMessage: err.message})
        }
        
        this.setState({loading: false})
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
         <Button loading={this.state.loading} primary>
           Create!
         </Button>
       </Form>
        );
    }
}

export default HouseholdForm;