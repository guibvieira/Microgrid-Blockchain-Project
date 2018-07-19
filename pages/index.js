import React, { Component } from 'react';
import {Card } from 'semantic-ui-react';
import Layout from '../components/Layout';
import HouseholdForm from '../components/HouseholdForm';
import factory from '../ethereum/factory';
import web3 from '../ethereum/web3';


class Household extends Component{
    

    static async getInitialProps() {
        const households = await factory.methods.getDeployedHouseholds().call();


        return { 
            households
        };
    }

    renderHouseholds(){
        console.log('renderHouseholds', this.props);
        const items = this.props.households.map(address => {
            return{
                header: address,
                description: (<a>View Household</a>),
                fluid: true
            };
        });

        return <Card.Group items={items} />;
    }

    

    render() {
        return(
            <Layout>
                <h3>Open Households</h3>
                <HouseholdForm></HouseholdForm>
                {this.renderHouseholds()}
            </Layout>
            
        )
    }
}

export default Household;