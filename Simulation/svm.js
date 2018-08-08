// Instantiate the svm classifier
var SVM = require('ml-svm');

const readCSV = require('./readFile');


async function loadData(inputFile){
    let resultSet = await readCSV(inputFile);
    return resultSet;
}
async function init(){
    inputFile = '../data/household_26.csv';
    householdData = await loadData(inputFile);

    let X_train = new Array();
    let X_test = new Array();
    //prepare the data
    for (i=0; i<householdData.length; i++){
        X_train.push(new Array(householdData[i][0], householdData[i][4], householdData[i][5], householdData[i][6], householdData[i][7], householdData[i][8],householdData[i][9],householdData[i][10],householdData[i][11], householdData[i][12], householdData[i][13],householdData[i][14],householdData[i][15] )  );
        X_test.push( householdData[i][2] );
    }
    console.log('xtrain', X_train);
    console.log('xtest', X_test);
    var options = {
        C: 0.01,
        tol: 10e-4,
        maxPasses: 10,
        maxIterations: 10000,
        kernel: 'rbf',
        kernelOptions: {
          sigma: 0.5
        }
      };
    let svm = new SVM(options);

    // Train the classifier - we give him an xor
    let features = X_train;
    let labels = X_test
    console.log('features', features);
    console.log('labels', labels);
    console.log('start training');
    svm.train(features, labels);
    
    // Let's see how narrow the margin is
    let margins = svm.margin(features);
    
    // Let's see if it is separable by testing on the training data
    let results = svm.predict(features); // [1, -1, 1, -1]
    console.log('results before saving the mode', results);
    // I want to see what my support vectors are
    console.log('im before the support vectors');
    //let supportVectors = svm.supportVectors();
    
    // Now we want to save the model for later use
    let model = svm.toJSON();
    
    /// ... later, you can make predictions without retraining the model
    let importedSvm = SVM.load(model);
    let resultsFinal = importedSvm.predict(features[50]); // [1, -1, 1, -1]

    /* Run */
    console.log('neural network result', resultsFinal);
    console.log('actual value', labels[50]);

}
init();


 