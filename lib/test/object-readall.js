// test/object-readall.js
//
// Testing DatabankObject readAll()
//
// Copyright 2012, StatusNet Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var vows = require('vows'),
    assert = require('assert'),
    databank = require('../databank'),
    Databank = databank.Databank,
    Step = require('step'),
    DatabankObject = require('../databankobject').DatabankObject;

var objectReadallContext = function(driver, params) {

    var context = {};
    var bank = null;
    var people = null; 

    var data = [
        {username: 'evanp', name: {last: 'Prodromou', first: 'Evan'}, age: 42},
        {username: 'spock', name: {first: 'Spock'}, age: 186},
        {username: 'jed', name: {first: 'Jed', last: 'Sanders'}, age: 21},
        {username: 'hunter', name: {first: 'Hunter', last: 'Thompson'}, age: 64},
        {username: 'tristan', name: {first: 'Tristan', last: 'Farnon'}, age: 40} 
    ];

    var ids = ['spock', 'jed', 'hunter', 'invalid'];

    var Person = DatabankObject.subClass('person');

    // Override so there's not a global causing grief.

    Person.bank = function() {
        return bank;
    };

    context["When we create a " + driver + " databank"] = {
        topic: function() {
            params.schema = {
                person: {
                    pkey: 'username'
                }
            };
            bank = Databank.get(driver, params);
            return bank;
        },
        'We can connect to it': {
            topic: function() {
                DatabankObject.bank = bank;
                bank.connect(params, this.callback);
            },
            'without an error': function(err) {
                assert.ifError(err);
            },
            'and we can create some people': {
                topic: function() {
                    var that = this;
                    Step(
                        function() {
                            var i, group = this.group();
                            for (i = 0; i < data.length; i++) {
                                Person.create(data[i], group());
                            }
                        },
                        function(err, ppl) {
                            people = ppl;
                            that.callback(err, ppl);
                        }
                    );
                },
                'without an error': function(err, ppl) {
                    assert.ifError(err);
                },
                'and we can read a few of them': {
                    topic: function() {
                        Person.readAll(ids, this.callback);
                    },
                    'without an error': function(err, pplMap) {
                        assert.ifError(err);
                        assert.isObject(pplMap);
                        assert.isObject(pplMap.spock);
                        assert.isObject(pplMap.jed);
                        assert.isObject(pplMap.hunter);
                        assert.isNull(pplMap.invalid);
                    }
                },
                teardown: function(err, ppl) {
                    var that = this;
                    Step(
                        function() {
                            var i, group = this.group();
                            for (i = 0; i < people.length; i++) {
                                people[i].del(group());
                            }
                        },
                        function(err) {
                            that.callback(err);
                        }
                    );
                }
            },
            teardown: function() {
                bank.disconnect(this.callback);
            }
        }
    };

    return context;
};

module.exports = objectReadallContext;
