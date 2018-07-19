import React, { Component } from 'react';
import Layout from '../../components/Layout';
// import { Link, Router } from '../routes';
// import Household from '../../ethereum/household';

class HouseholdPage extends Component {
    static async getInitialProps(props) {
        // const household = Household(props.query.address);

        return { 
            address: props.query.address
         }
    }

    render() {
        return (
            <Layout>
                <h1>I am the household page, this is my address {this.props.address}</h1>
            </Layout>
        );
    }
}

export default HouseholdPage;
