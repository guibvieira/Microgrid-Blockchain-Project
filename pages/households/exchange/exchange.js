import React, { Component } from 'react';
import Layout from '../../../components/Layout';
import BidsRow from '../../../components/BidsRow';
import AsksRow from '../../../components/AsksRow';
import HouseholdContract from '../../..//ethereum/household';
import web3 from '../../..//ethereum/web3';
import exchange from '../../../ethereum/exchange';
import { Dropdown, Menu, Table, Button, Grid } from 'semantic-ui-react';
import SubmitBidInput from '../../../components/SubmitBidInput';
import SubmitSellInput from '../../../components/SubmitSellInput';

class ExchangePage extends Component {

    state = {
        errorMessage: '',
        loading: false,
        selectedOption: 1,
        buyVolume: '',
        askVolume: ''
    };

    static async getInitialProps(props) {
        const {address} = props.query;
        const exchangeAddress = exchange.options.address;
        const household = HouseholdContract(props.query.address);

        let bidsCount = await exchange.methods.getBidsCount().call();
        let asksCount = await exchange.methods.getAsksCount().call();

        let bidsTemp = new Array();
        let asksTemp = new Array();
        
        for(let i=0; i < bidsCount; i++){
            let bid = await exchange.methods.getBid(i).call();
            bidsTemp[i] = parseInt(bid['2'], 10);
        }
        for(let i=0; i < asksCount; i++){
            let ask = await exchange.methods.getAsk(i).call();
            asksTemp[i] = parseInt(ask['2'], 10);
        }

     
        const sumBids = bidsTemp.reduce((a, b) => a + b, 0);
        const sumAsks = asksTemp.reduce((a,b) => a + b, 0);

        const bids = await Promise.all(
            Array(parseInt(bidsCount)).fill().map((element, index) => {
                return exchange.methods.Bids(index).call()
            })
        );

        const asks = await Promise.all(
            Array(parseInt(asksCount)).fill().map((element, index) => {
                return exchange.methods.Asks(index).call()
            })
        );

        return {bids, bidsCount, asks, asksCount, address, exchange, exchangeAddress, household, sumBids, sumAsks};
    }

    renderBuyRows() {
        return this.props.bids.map((bids, index) => {
            return <BidsRow 
              id={index}
              bids={bids}
              address={this.props.address}
              bidsCount={this.props.bidsCount}
            />;
        })
    }

    renderAskRows(){
        return this.props.asks.map((asks, index) => {
            return <AsksRow 
              id={index}
              asks={asks}
              address={this.props.address}
              bidsCount={this.props.asksCount}
            />;
        })
    }

    onDropDownChange = (event, data) => {
        console.log('onDropDownChange', data);
        this.setState({ selectedOption: data.value });
        console.log('current state', this.state.selectedOption);
    }
    
    renderInput() {
        if(this.state.selectedOption == 1){
            return <SubmitBidInput address={this.props.address} />
        }
        if(this.state.selectedOption == 2){
            return <SubmitSellInput address={this.props.address} />
        }
    }

    render() {
        const {Header, Row, HeaderCell, Body } = Table;

        const options = [
            { key: 1, text: 'Buy', value: 1},
            { key: 2, text: 'Sell', value: 2}
        ]

        return (
        <Layout>
            <Grid>
                <Grid.Row>
                    <Grid.Column width={8}>GRAPH 1</Grid.Column>
                    <Grid.Column width={8}>GRAPH 2</Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column width={7}>
                        <h3>Buy Order Book</h3>
                        <Table>
                            <Header>
                                <Row>
                                    <HeaderCell>ID</HeaderCell>
                                    <HeaderCell>From address</HeaderCell>
                                    <HeaderCell>Amount</HeaderCell>
                                    <HeaderCell>Price</HeaderCell>
                                    <HeaderCell>Date</HeaderCell>
                                </Row>
                            </Header>
                            <Body>
                                {this.renderBuyRows()} 
                            </Body>
                        </Table>
                        <div>There are {this.props.bidsCount} bids.</div>
                        <div>Buying Volume is {this.props.sumBids} W/h.</div>
                        <h3>Ask Order Book</h3>
                        <Table>
                            <Header>
                                <Row>
                                    <HeaderCell>ID</HeaderCell>
                                    <HeaderCell>From address</HeaderCell>
                                    <HeaderCell>Amount</HeaderCell>
                                    <HeaderCell>Price</HeaderCell>
                                    <HeaderCell>Date</HeaderCell>
                                </Row>
                            </Header>
                            <Body>
                                {this.renderAskRows()} 
                            </Body>
                        </Table>
                        <div>There are {this.props.asksCount} asks.</div>
                        <div>Buying Volume is {this.props.sumAsks} W/h.</div>
                    </Grid.Column>
                    <Grid.Column width={3}>
                        <Menu compact style={{marginBottom: '10px'}} >
                            <Dropdown text='Buy/Sell' options={options}  
                            onChange={this.onDropDownChange} simple item />
                        </Menu>
                        {this.renderInput()}  
                    </Grid.Column>
                    <Grid.Column width={6}>
                    <h3>Buy Order Book</h3>
                        <Table>
                            <Header>
                                <Row>
                                    <HeaderCell>ID</HeaderCell>
                                    <HeaderCell>From address</HeaderCell>
                                    <HeaderCell>Amount</HeaderCell>
                                    <HeaderCell>Price</HeaderCell>
                                    <HeaderCell>Date</HeaderCell>
                                </Row>
                            </Header>
                            <Body>
                                {this.renderBuyRows()} 
                            </Body>
                        </Table>
                        <div>There are {this.props.bidsCount} bids.</div>
                        <div>Buying Volume is {this.props.sumBids} W/h.</div>
                        <h3>Ask Order Book</h3>
                        <Table>
                            <Header>
                                <Row>
                                    <HeaderCell>ID</HeaderCell>
                                    <HeaderCell>From address</HeaderCell>
                                    <HeaderCell>Amount</HeaderCell>
                                    <HeaderCell>Price</HeaderCell>
                                    <HeaderCell>Date</HeaderCell>
                                </Row>
                            </Header>
                            <Body>
                                {this.renderAskRows()} 
                            </Body>
                        </Table>
                        <div>There are {this.props.asksCount} asks.</div>
                        <div>Buying Volume is {this.props.sumAsks} W/h.</div>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Layout>
        ); 
    }
}

export default ExchangePage;