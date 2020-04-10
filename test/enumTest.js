(function(global){
  var expect = global.expect || require('expect.js');
  var endianness = global.Enum ? 'LE' : require('os').endianness();
  var e = global.Enum || require('../');

  // for zuul / saucelabs
  Enum = undefined;

  function envSupportsFreezing() {
    return (
      Object.isFrozen && Object.isSealed &&
      Object.getOwnPropertyNames && Object.getOwnPropertyDescriptor &&
      Object.defineProperties && Object.__defineGetter__ && Object.__defineSetter__
    );
  }

  describe('Enum', function() {

    describe('calling register', function() {

      it('it should register Enum on global namespace', function() {

        expect(Enum).not.to.be.ok();
        e.register();
        expect(Enum).to.be.ok();

      });

    });

    describe('defining an enum', function() {

      var myEnum;

      describe('in a simple or complex way', function() {

        it('it should be the same', function() {

          myEnum = new e(['A', 'B', 'C']);

          var myEnum2 = new e({'A': 1, 'B': 2, 'C': 4});

          expect(myEnum.A).to.eql(myEnum2.A);
          expect(myEnum.C).to.eql(myEnum2.C);

          expect(myEnum.A.value).to.eql(myEnum2.A.value);
          expect(myEnum.C.value).to.eql(myEnum2.C.value);

        });

        describe('calling toJSON', function () {

          it('it should return a copy of the whole enum type', function() {

            var json = myEnum.toJSON();
            expect(json).to.have.property('A', 1);
            expect(json).to.have.property('B', 2);
            expect(json).to.have.property('C', 4);

          });

        });

        describe('stringifying', function () {

          it('it should return a copy of the whole enum type', function() {

            expect(JSON.stringify(myEnum)).to.be('{"A":1,"B":2,"C":4}');

          });

        });

        describe('it should be possible to', function() {

          it('get an enum item', function() {

            expect(myEnum.A).to.have.property('value', 1);
            expect(myEnum.A).to.have.property('key', 'A');

            expect(myEnum.C).to.have.property('value', 4);
            expect(myEnum.C).to.have.property('key', 'C');

          });

          it('get all enum values', function() {

            expect(myEnum.enums).to.be.an('array');
            expect(myEnum.enums).to.have.length(3);
            expect(myEnum.enums).to.contain(myEnum.A);
            expect(myEnum.enums).to.contain(myEnum.B);
            expect(myEnum.enums).to.contain(myEnum.C);

          });

          describe('call has', function() {

            describe('on a flagged enum item', function() {

              var myItem;

              before(function() {
                myItem = myEnum.get(3);
                expect(myEnum.get('A | B').value).to.eql(myItem.value);
              });

              it('with another item', function() {

                expect(myItem.has(myEnum.B)).to.be(true);
                expect(myItem.has(myEnum.C)).not.to.be(true);

              });

              it('with another key', function() {

                expect(myItem.has('B')).to.be(true);
                expect(myItem.has('C')).not.to.be(true);

              });

              it('with another value', function() {

                expect(myItem.has(2)).to.be(true);
                expect(myItem.has(4)).not.to.be(true);

              });

            });

          });

          describe('compare', function() {

            describe('an item', function() {

              it('has been defined', function() {

                expect(myEnum.isDefined(myEnum.A)).to.be(true);
                expect(myEnum.isDefined('A')).to.be(true);
                expect(myEnum.isDefined(1)).to.be(true);

                var myEnum2 = new e({'A': 1, 'B': 2, 'C': 4});
                expect(myEnum2.isDefined(myEnum2.C)).to.be(true);
                expect(myEnum2.isDefined('C')).to.be(true);
                expect(myEnum2.isDefined(4)).to.be(true);

                expect(myEnum.isDefined(myEnum2.C)).to.be(false);
                expect(myEnum2.isDefined(myEnum.A)).to.be(false);

                expect(myEnum.isDefined(myEnum)).to.be(false);
                expect(myEnum.isDefined(myEnum2)).to.be(false);

                expect(myEnum.isDefined()).to.be(false);
                expect(myEnum.isDefined('Z')).to.be(false);
                expect(myEnum.isDefined(10)).to.be(false);
                expect(myEnum.isDefined({})).to.be(false);
                expect(myEnum.isDefined(null)).to.be(false);
                expect(myEnum.isDefined(undefined)).to.be(false);

              });

            });

            describe('an item and an item', function() {

              it('with is', function() {

                expect(myEnum.A.is(myEnum.A)).to.be(true);
                expect(myEnum.A.is(myEnum.C)).not.to.be(true);

              });

              it('with has', function() {

                expect(myEnum.A.has(myEnum.A)).to.be(true);
                expect(myEnum.A.has(myEnum.C)).not.to.be(true);

              });

              it('with ==', function() {

                expect(myEnum.A == myEnum.A).to.be(true);
                expect(myEnum.A == myEnum.C).not.to.be(true);

              });

              it('with ===', function() {

                expect(myEnum.A === myEnum.A).to.be(true);
                expect(myEnum.A === myEnum.C).not.to.be(true);

              });

            });

            describe('an item and a key', function() {

              it('with is', function() {

                expect(myEnum.A.is('A')).to.be(true);
                expect(myEnum.A.is('C')).not.to.be(true);

              });

              it('with has', function() {

                expect(myEnum.A.has('A')).to.be(true);
                expect(myEnum.A.has('C')).not.to.be(true);

              });

              it('with ==', function() {

                expect(myEnum.A == myEnum.A.value).to.be(true);
                expect(myEnum.A == myEnum.C.value).not.to.be(true);

              });

            });

            describe('an item and a value', function() {

              it('with is', function() {

                expect(myEnum.A.is(1)).to.be(true);
                expect(myEnum.A.is(4)).not.to.be(true);

              });

              it('with has', function() {

                expect(myEnum.A.has(1)).to.be(true);
                expect(myEnum.A.has(4)).not.to.be(true);

              });

            });

          });

          describe('call get and get', function() {

            it('an enum item by item', function() {

              expect(myEnum.get(myEnum.A)).to.have.property('value', 1);
              expect(myEnum.get(myEnum.A)).to.have.property('key', 'A');

              expect(myEnum.get(myEnum.C)).to.have.property('value', 4);
              expect(myEnum.get(myEnum.C)).to.have.property('key', 'C');

            });

            it('an enum item by flagged item', function() {

              var item = myEnum.get('A | B');

              expect(myEnum.get(item)).to.have.property('value', 3);
              expect(myEnum.get(item)).to.have.property('key', 'A | B');

            });

            it('an enum item by value', function() {

              expect(myEnum.get('A')).to.have.property('value', 1);
              expect(myEnum.get('A')).to.have.property('key', 'A');

              expect(myEnum.get('C')).to.have.property('value', 4);
              expect(myEnum.get('C')).to.have.property('key', 'C');

            });

            it('an enum item by key', function() {

              expect(myEnum.get(1)).to.have.property('value', 1);
              expect(myEnum.get(1)).to.have.property('key', 'A');

              expect(myEnum.get(4)).to.have.property('value', 4);
              expect(myEnum.get(4)).to.have.property('key', 'C');

            });

            describe('undefined', function() {

              it('for null', function() {
                expect(myEnum.get(null)).to.be(undefined);
              });

              it('for undefined', function() {
                expect(myEnum.get(undefined)).to.be(undefined);
              });

              it('for invalid key/value', function() {
                expect(myEnum.get('X')).to.be(undefined);
              });

            });

          });


          describe('call getValue and get', function() {

            it('an enum value by item', function() {

              expect(myEnum.getValue(myEnum.A)).to.be(1);

              expect(myEnum.getValue(myEnum.C)).to.be(4);

            });

            it('an enum value by key', function() {

              expect(myEnum.getValue('A')).to.be(1);

              expect(myEnum.getValue('C')).to.be(4);

            });

            it('an enum value by value', function() {

              expect(myEnum.getValue(1)).to.be(1);

              expect(myEnum.getValue(4)).to.be(4);

            });

            describe('undefined', function() {

              it('for null', function() {
                expect(myEnum.getValue(null)).to.be(undefined);
              });

              it('for undefined', function() {
                expect(myEnum.getValue(undefined)).to.be(undefined);
              });

              it('for invalid key/value', function() {
                expect(myEnum.getValue('X')).to.be(undefined);
              });

            });

          });

          describe('call getKey and get', function() {

            it('an enum key by item', function() {

              expect(myEnum.getKey(myEnum.A)).to.be('A');

              expect(myEnum.getKey(myEnum.C)).to.be('C');

            });

            it('an enum value by key', function() {

              expect(myEnum.getKey('A')).to.be('A');

              expect(myEnum.getKey('C')).to.be('C');

            });

            it('an enum value by value', function() {

              expect(myEnum.getKey(1)).to.be('A');

              expect(myEnum.getKey(4)).to.be('C');

            });

            describe('undefined', function() {

              it('for null', function() {
                expect(myEnum.getKey(null)).to.be(undefined);
              });

              it('for undefined', function() {
                expect(myEnum.getKey(undefined)).to.be(undefined);
              });

              it('for invalid key/value', function() {
                expect(myEnum.getKey('X')).to.be(undefined);
              });

            });
          });

        });

        describe('on an enum item it should be possible to', function() {

          it('call toString and get the key', function() {

            expect(myEnum.A.toString()).to.be('A');

          });

          it('call toJSON and get the key', function() {

            expect(myEnum.A.toJSON()).to.be('A');

          });

          it('call valueOf and get the value', function() {

            expect(myEnum.A.valueOf()).to.be(myEnum.A.value);

          });

          it('use JavaScript | operator', function() {

            expect(myEnum.A | myEnum.B).to.be(myEnum.getValue('A | B'));

            expect(myEnum.A | myEnum.C).to.be(myEnum.getValue('A | C'));

            expect(myEnum.A | myEnum.B | myEnum.C).to.be(myEnum.getValue('A | B | C'));

          });

          it('stringify JSON', function() {

            expect(JSON.stringify(myEnum.A)).to.be('"A"');

          });

        });

      });

      describe('on an enum object', function(){

        var frozenEnum;

        before(function(){
          frozenEnum = new e({'A':1, 'B':2, 'C':4}, { freeze: true });
        });

        if (envSupportsFreezing()) {

          it('can not extend after creation', function() {

            var extendMyEnum = Object.isExtensible(frozenEnum);
            expect(extendMyEnum).to.be(false);

          });

          it('does not accept changes to existing property values, throws', function() {

            expect(frozenEnum).to.have.property('C');
            expect(function() {
              frozenEnum['C'] = 3;
            }).to.throwError("The value can not be set; Enum Type is not extensible.");
            expect(function() {
              Object.defineProperty(frozenEnum, 'C', {value: 3, writable:true, configurable: true});
            }).to.throwError();
            expect(frozenEnum.get('C')).to.have.property('value', 4);
            expect(frozenEnum).to.be(frozenEnum);

          });

          it('can not define new properties, throws', function() {

            expect(function() {
              Object.defineProperty(frozenEnum, 'D', {writable: true, enumerable:true});
            }).to.throwError();
            expect(frozenEnum.D).to.be(undefined);
            expect(frozenEnum).not.to.have.property('D');
            expect(frozenEnum).to.be(frozenEnum);

          });

          it('is persistent to deletes', function() {

            var deleteEnumItem = delete frozenEnum['A'];
            expect(deleteEnumItem).to.be(false);
            expect(frozenEnum).to.have.property('A');
            expect(frozenEnum.get('A')).to.have.property('value', 1);
            expect(frozenEnum).to.be(frozenEnum);

          });
        }

        it('creates unique identity for each property', function() {

          var myEnum1 = new e({'A':1, 'B':2, 'C':4});
          var myEnum2 = new e({'A':1, 'B':2, 'C':4});
          expect(myEnum1.A).not.to.equal(myEnum2.A);
          expect(myEnum1.B).not.to.equal(myEnum2.B);
          expect(myEnum1.C).not.to.equal(myEnum2.C);
          expect(myEnum1).not.to.equal(myEnum2);

        });

      });

      describe('being flagged', function() {

        var myFlaggedEnum;

        before(function() {
          myFlaggedEnum = new e({'A': 1, 'B': 2, 'C': 4});
        });

        it('it should get the flagged value', function() {

          expect(myFlaggedEnum.get(1)).to.be(myFlaggedEnum.A);
          expect(myFlaggedEnum.get(2)).to.be(myFlaggedEnum.B);
          expect(myFlaggedEnum.get(3).is('A | B')).to.be(true);

        });

      });

      describe('not being flagged', function() {

        var myNonFlaggedEnum;

        before(function() {
          myNonFlaggedEnum = new e({'0': 0, 'A': 1, 'B': 2, 'B2': 3, 'C': 4});
        });

        it('it should not get the flagged value', function() {

          expect(myNonFlaggedEnum.get(1)).to.be(myNonFlaggedEnum.A);
          expect(myNonFlaggedEnum.get(2)).to.be(myNonFlaggedEnum.B);
          expect(myNonFlaggedEnum.get(3)).to.be(myNonFlaggedEnum.B2);

        });

        describe('getting a non matching value', function() {

          it('it should return undefined', function() {

            expect(myNonFlaggedEnum.get(5)).to.be(undefined);

          });

        });

      });

      describe('and getting an item of it from another enum', function () {

        it('it should return undefined', function() {

          var myEnum1 = new e(['A', 'B', 'C']);

          var myEnum2 = new e({'A': 1, 'B': 2, 'C': 4});

          expect(myEnum2.get(myEnum1.A)).to.be(undefined);

        });

      });

      describe('ref Type interface', function () {

        it('should define a `size` Number', function () {

          var myEnum = new e(['A', 'B', 'C']);

          expect(myEnum.size).to.be.a('number');

        });

        it('should define an `indirection` Number', function () {

          var myEnum = new e(['A', 'B', 'C']);

          expect(myEnum.indirection).to.be.a('number');

        });

        it('should work with Buffer for `get()`', function () {

          var myEnum = new e(['A', 'B', 'C']);
          var buffer = new Buffer(myEnum.size);

          buffer['writeUInt32' + endianness](myEnum.B.value, 0);

          expect(myEnum.get(buffer)).to.be(myEnum.B);

        });

        it('should work with Buffer for `set()`', function () {

          var myEnum = new e(['A', 'B', 'C']);
          var buffer = new Buffer(myEnum.size);

          myEnum.set(buffer, 0, myEnum.B);

          expect(buffer['readUInt32' + endianness](0)).to.be(myEnum.B.value);

        });

        it('should extend with another array', function() {

          var myEnum = new e(['A', 'B', 'C']);

          var assignedValues = { D: 8, E: 16, F: 32 };
          myEnum.extend(['D', 'E', 'F']);

          expect(myEnum.D.value).to.eql(assignedValues.D);
          expect(myEnum.E.value).to.eql(assignedValues.E);
          expect(myEnum.F.value).to.eql(assignedValues.F);
        });

      });

      describe('being not case sensitive', function() {

        var myEnum = new e(['One', 'tWo', 'ThrEE'], { ignoreCase: true });

        it('it should work correctly even if not requesting exactly the same key value', function() {

          expect(myEnum.get('one').value).to.be(myEnum.One.value);
          expect(myEnum.get('two').value).to.be(myEnum.tWo.value);
          expect(myEnum.get('THREE').value).to.be(myEnum.ThrEE.value);

          expect(myEnum.One.is('onE')).to.be(true);
          expect(myEnum.tWo.is('Two')).to.be(true);
          expect(myEnum.ThrEE.is('three')).to.be(true);

          expect(myEnum.One.has('onE')).to.be(true);
          expect(myEnum.tWo.has('Two')).to.be(true);
          expect(myEnum.ThrEE.has('three')).to.be(true);

        });

      });

      describe('with a reserved enumitem name', function() {
        var reservedKeys = [ '_options', 'get', 'getKey', 'getValue', 'enums', 'isFlaggable' ];

        it('throws an error', function() {
          for (var k = 0; k < reservedKeys.length; k++) {

            expect(function(){ new e([reservedKeys[k]]); }).to.throwError(new RegExp(reservedKeys[k]));

          }
        });

        it('does not throw an error for `name`', function() {

          expect(function(){ new e(['name']); }).not.to.throwError();

        });

      });

      describe('with a custom name', function() {

        it('can be given as second argument', function() {
          var myEnum = new e(['oneFish', 'twoFish'], 'RedFish');

          expect(myEnum.name).to.be('RedFish');
        });

        it('can be given as an option', function() {
          var myEnum = new e(['oneFish', 'twoFish'], { name: 'BlueFish' });

          expect(myEnum.name).to.be('BlueFish');
        });

        it('cannot accept an enumitem also named `name`', function() {
          expect(function(){ new e(['name'], 'customName'); }).to.throwError(/name/);
        });

      });

    });

    describe('iterating an enum', function() {
      var values = ['A', 'B', 'D']
      var myEnum = new e(values)

      it('should iterate through the enum items', function() {
        var index = 0
        for (var enumItem of myEnum) {
          expect(enumItem.key).to.equal(values[index])
          expect(enumItem).to.equal(myEnum.get(enumItem.key))
          index++
        }
        expect(index).to.equal(values.length)
      })
    })

  });
})(this);
