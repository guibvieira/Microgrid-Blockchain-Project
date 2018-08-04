import React, { Component } from 'react';
import Layout from '../../../components/Layout';
import HouseholdContract from '../../..//ethereum/household';
import web3 from '../../..//ethereum/web3';
import Exchange from '../../../ethereum/exchange';
import { Dropdown, Menu } from 'semantic-ui-react';
import SubmitBidInput from '../../../components/SubmitBidInput';
import SubmitSellInput from '../../../components/SubmitSellInput';

class ExchangePage extends Component {
    state = {
        errorMessage: '',
        loading: false,
        selectedOption: ''
    };

    static async getInitialProps(props) {
        const exchange = Exchange;
        const exchangeAddress = exchange.options.address;
        const household = HouseholdContract(props.query.address);

        console.log(exchange);
        console.log(props.query.address);
        return { 
            address: props.query.address,
            exchange: exchange,
            exchangeAddress: exchangeAddress,
            household: household
        };
    }

    handleChange = (selectedOption) => {
        this.setState({selectedOption});
    };
    
    buySellSelection () {
        if(this.state.selectedOption == 1){
            return <SubmitBidInput />
        }
        if(this.state.selectedOption == 2){
            return <SubmitSellInput />
        }
    }

    
    render() {
        const options = [
            { key: 1, text: 'Buy', value: 1},
            { key: 2, text: 'Sell', value: 2}
        ]
        return (
        <Layout>
            <Menu compact style={{marginBottom: '10px'}} >
                <Dropdown text='Buy/Sell' options={options} onChange={this.handleChange}
                onChange={(event) =>
                this.setState({ selectedOption: options.value })} simple item />
            </Menu>
            {this.buySellSelection()}
        </Layout>
        );
        
    }
}

export default ExchangePage;
{/* <SubmitBidInput  address={this.props.address} /> */}

