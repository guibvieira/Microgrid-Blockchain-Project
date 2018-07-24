import React, { Component } from 'react';
import Layout from '../../../components/Layout';
// import HouseholdContract from '../../..//ethereum/household';
import web3 from '../../..//ethereum/web3';
import Exchange from '../../../ethereum/exchange';
import { Dropdown, Menu } from 'semantic-ui-react';
import SubmitBidInput from '../../../components/SubmitBidInput';

class ExchangePage extends Component {
    static async getInitialProps() {
        const exchange = Exchange;

        console.log(exchange);
        return { 
            exchange
        };
    }
    
    render() {
        const options = [
            { key: 1, text: 'Buy', value: 1},
            { key: 2, text: 'Sell', value: 2}
        ]
        return (
        <Layout>
            <Menu compact style={{marginBottom: '10px'}} >
                <Dropdown text='Buy/Sell' options={options} simple item />
            </Menu>
            <SubmitBidInput />
        </Layout>
        );
        
    }
}

export default ExchangePage;

{/* <Layout>
            <Dropdown text='Buy' floating labeled button className='icon'>
                <Dropdown.Menu className='Sell'>
                </Dropdown.Menu>
            </Dropdown>
        </Layout> */}