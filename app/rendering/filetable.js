'use strict';

var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var Table = ReactBootstrap.Table;
var ProgressBar = ReactBootstrap.ProgressBar;
var Modal = ReactBootstrap.Modal;
var ModalTrigger = ReactBootstrap.ModalTrigger;


var CommitModal = React.createClass({

    getInitialState: function() {
        return {
            commitDetails: ''
        }
    },

    componentDidMount: function() {
        // Request the details about the commit
        require('ipc').send('getCommitDetails', this.props.commitSHA);
        require('ipc').on('commitDetailsReceived', this.commitDetailsReceived);
    },

    componentWillUnmount: function(){
        require('ipc').removeListener('commitDetailsReceived', this.commitDetailsReceived);
    },

    commitDetailsReceived: function(commitDetails) {
        // Details about the commit were received
        this.setState({commitDetails: commitDetails});
    },

    render: function() {
        return <Modal title={"Commit: " + this.props.commitSHA}
                backdrop={false}
                animation={false}
                onRequestHide={this.props.onRequestHide}>
                    <div className="modal-body">
                        <pre>
                            {this.state.commitDetails}
                        </pre>
                    </div>
                    <div className="modal-footer">
                        <Button onClick={this.props.onRequestHide}>Close</Button>
                    </div>
                </Modal>
    }
});


var FileTable = React.createClass({

    render: function() {

        var renderedFiles = this.props.largeFiles.map((function(file, index) {
            var className = '';
            if (file.isSelected) {
                className = 'selected';
            }

            var fileName = file.name;
            if (typeof(fileName) == 'undefined') {
                fileName = <ProgressBar className="mini" active={true} now={100} />
            }

            var commitSHA;
            if (typeof(file.commitSHA) == 'undefined') {
                commitSHA = <ProgressBar className="mini" active={true} now={100} />
            }
            else {
                commitSHA = <ModalTrigger modal={<CommitModal commitSHA={file.commitSHA} />}>
                              <a style={{cursor: 'pointer'}}>{file.commitSHA}</a>
                            </ModalTrigger>
            }

            return (
                <tr key={file.blobSHA} className={className}>
                    <td>{index+1}.</td>
                    <td>{fileName}</td>
                    <td>{file.size}</td>
                    <td>{commitSHA}</td>
                </tr>
            );
        }).bind(this));

        return (
            <Table {...this.props} className="file-table" striped bordered condensed hover>
                <thead>
                    <th>{'#'}</th>
                    <th>Largest files</th>
                    <th>Size</th>
                    <th>Commit SHA</th>
                </thead>
                <tbody>
                    {renderedFiles}
                </tbody>
            </Table>
        );
    }
});