'use strict';

var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var Input = ReactBootstrap.Input;
var ProgressBar = ReactBootstrap.ProgressBar;
var Button = ReactBootstrap.Button;
var Glyphicon = ReactBootstrap.Glyphicon;


var MainController = React.createClass({

    getDefaultProps: function() {
        return {
            repoSize: '',
            repoName: '',
            largeFiles: []
        };
    },

    getInitialState: function() {
        return {
            isLoading: false
        }
    },

    getLargeFiles: function() {
        this.setState({ isLoading: true });
        var select = this.refs.numberOfFiles.getInputDOMNode();
        require('ipc').send('getLargeFiles', select.options[select.selectedIndex].value);
    },


    /************************************************************************

     EVENT HANDLERS

    *************************************************************************/

    componentDidMount: function() {
        var self = this;

        // IPC communication with the browser --------------------------------

        require('ipc').on('repoOpened', function(repoName) {
            // Reset files and request new ones
            self.setProps({ repoName: repoName, largeFiles: [] });
            self.getLargeFiles();
        });

        require('ipc').on('sizeUpdated', function(repoSize) {
            self.setProps({ repoSize: repoSize });
        });

        require('ipc').on('fileListUpdated', function(files) {
            self.setState({ isLoading: false });
            self.setProps({ largeFiles: files });
        });

    },

    openButtonClicked: function() {
        require('ipc').send('showOpenDialog');
    },


    /************************************************************************

     RENDERING

    *************************************************************************/

    render: function() {

        var fileTable, select, refresh;

        if (this.props.repoName) {
            refresh = <Button className="refresh"><Glyphicon glyph="refresh" onClick={this.getLargeFiles} /></Button>;
            select = <div className="number-of-files">
                         <label>Display files:</label>
                         <Input  type="select" defaultValue="10" ref="numberOfFiles" onChange={this.getLargeFiles} >
                             <option value="20">20</option>
                             <option value="50">50</option>
                             <option value="100">100</option>
                         </Input>
                     </div>;

            if (this.state.isLoading) {
                fileTable = <div className="file-table-loading">
                                <p>Analyzing the repository. This may take a while...</p>
                                <ProgressBar active={true} now={100} />
                            </div>
            }
            else {
                fileTable = <FileTable largeFiles={this.props.largeFiles} />;
            }

            return <div>
                       <header>
                           <div className="header-inner">
                               <h2 className="info">{this.props.repoName} <span className="size">({this.props.repoSize})</span></h2>
                               {refresh}{select}
                           </div>
                       </header>
                       <div className="main">
                           {fileTable}
                       </div>
                   </div>;
        }
        else {
            // No repository has been loaded yet
            return <div className='intro'>
                       <Button className="open-button" onClick={this.openButtonClicked}>Open a Git repository...</Button>;
                   </div>
        }
    }
});


var mainController = MainController();

React.render(mainController, document.body);