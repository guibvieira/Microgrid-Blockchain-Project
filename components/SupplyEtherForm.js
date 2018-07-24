import React, { Component } from 'react';
import { Form, Input, Message, Button } from 'semantic-ui-react';
import web3 from '../ethereum/web3';
import { Router } from '../routes';
import Household from '../ethereum/household';

class SupplyEtherForm extends Component {

    state = {
        errorMessage: '',
        loading: false,
        value: ''
    };

    supplyEther = async (event) => {
        event.preventDefault();

        const household = Household(this.props.address);
        console.log(this.props.address);

        this.setState( { errorMessage: '', loading: true});

        console.log(this.state.loading);

        try {
            const accounts = await web3.eth.getAccounts();
            console.log('accounts', accounts);
            await household.methods.deposit().send({
                from: accounts[0],
                gas: '1000000',
                value: web3.utils.toWei(this.state.value, 'ether')
            });

            Router.replaceRoute(`/households/${this.props.address}`);
        } catch (err) {
            this.setState({errorMessage: err.message})
        }
        
        this.setState({loading: false});
    }

    onInputChanged(event) {
        this.setState({ value: event.target.value });
        console.log(this.state);
    }

    render() {
        return (

        <Form onSubmit={this.supplyEther} error={!!this.state.errorMessage}>
         <Form.Field>
           <label>Supply Ether to Contract</label>
           <Input
             type='number'
             value={this.state.value}
             size='mini'
             label='Ether'
             labelPosition='right'
              onChange={ event => this.onInputChanged(event)}
           />
         </Form.Field>

         <Message error header='Oops!' content={this.state.errorMessage} />
         <Button loading={this.state.loading} primary>
           Supply!
         </Button>
       </Form>
        );
    }

}

export default SupplyEtherForm;