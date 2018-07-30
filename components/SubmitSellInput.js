import React, { Component } from 'react';
import { Form, Input, Message, Button} from 'semantic-ui-react';
import web3 from '../ethereum/web3';
import { Router } from '../routes';
import Household from '../ethereum/household';

class SubmitSellInput extends Component {
    state = {
        errorMessage: '',
        loading: false,
        price: '',
        amount: '',
        total: ''
    };

    submitBid = async (event) => {
        event.preventDefault();

        const household = Household(this.props.address);
        console.log(this.props.address);

        this.setState( { errorMessage: '', loading: true});

        console.log(this.state.loading);

        try {
            const accounts = await web3.eth.getAccounts();
            console.log('accounts', accounts);
            let date = new Date().getTime();
            await household.methods.submitAsk(this.state.price, this.state.amount, date).send({
                from: accounts[0],
                gas: '1999999'
            });

            Router.replaceRoute('exchange', {address: this.props.address});
        } catch (err) {
            this.setState({errorMessage: err.message});
        }
        this.setState({loading: false});
    }

    render() {
        return (
        
          <Form style={{width: "150px"}} onSubmit={this.submitBid} error={!!this.state.errorMessage}>
           <Form.Field>
             <label>Price (p/kWh)</label>
             <Input
             type='number'
             value={this.state.price}
             size='mini'
             label='p/kWh'
             labelPosition='right'
             onChange={event =>
                this.setState({ price: event.target.value })}
             />
             </Form.Field>

             <Form.Field>
             <label>Quantity (kWh)</label>
                <Input
                type='number'
                value={this.state.amount}
                size='mini'
                label='kWh'
                labelPosition='right'
                onChange={event =>
                    this.setState({ amount: event.target.value })}
             />
             </Form.Field> 
             <Form.Field>
             <label>Total (£)</label>
                <Input
                type='number'
                value={this.state.amount*this.state.price/100000}
                size='mini'
                label='£'
                labelPosition='right'                
             />
           </Form.Field>

            <Message error header='Oops!' content={this.state.errorMessage} />
                <Button loading={this.state.loading} primary>
                    Place Ask!
                </Button>
            </Form>
        );
    }
}

export default SubmitSellInput;