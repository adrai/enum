var expect = expect || require('expect.js'),
    endianness = this.Enum ? 'LE' : require('os').endianness(),
    e = this.Enum || require('../index');

describe('Enum', function() {

  if (typeof(module) !== 'undefined' && module.exports) {
    describe('calling register', function() {

      it('it should register Enum on global namespace', function() {

        expect(global.Enum).not.to.be.ok();
        e.register();
        expect(Enum).to.be.ok();

      });

    });
  }

  describe('defining an enum', function() {

    var myEnum;

    describe('in a simple or complex way', function() {

      it('it should be tha same', function() {

        myEnum = new e(['A', 'B', 'C']);

        var myEnum2 = new e({'A': 1, 'B': 2, 'C': 4});

        expect(myEnum.A).to.eql(myEnum2.A);
        expect(myEnum.C).to.eql(myEnum2.C);

        expect(myEnum.A.value).to.eql(myEnum2.A.value);
        expect(myEnum.C.value).to.eql(myEnum2.C.value);

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

              expect(myItem.has(myEnum.B)).to.be.ok();
              expect(myItem.has(myEnum.C)).not.to.be.ok();

            });

            it('with another key', function() {

              expect(myItem.has('B')).to.be.ok();
              expect(myItem.has('C')).not.to.be.ok();

            });

            it('with another value', function() {

              expect(myItem.has(2)).to.be.ok();
              expect(myItem.has(4)).not.to.be.ok();

            });

          });

        });

        describe('compare', function() {

          describe('an item and an item', function() {

            it('with is', function() {

              expect(myEnum.A.is(myEnum.A)).to.be.ok();
              expect(myEnum.C.is(myEnum.C)).to.be.ok();

            });

            it('with has', function() {

              expect(myEnum.A.has(myEnum.A)).to.be.ok();
              expect(myEnum.C.has(myEnum.C)).to.be.ok();

            });

            it('with ==', function() {

              expect(myEnum.A == myEnum.A).to.be.ok();
              expect(myEnum.C == myEnum.C).to.be.ok();

            });

            it('with ===', function() {

              expect(myEnum.A === myEnum.A).to.be.ok();
              expect(myEnum.C === myEnum.C).to.be.ok();

            });

          });

          describe('an item and a key', function() {

            it('with is', function() {

              expect(myEnum.A.is('A')).to.be.ok();
              expect(myEnum.C.is('C')).to.be.ok();

            });

            it('with has', function() {

              expect(myEnum.A.has('A')).to.be.ok();
              expect(myEnum.C.has('C')).to.be.ok();

            });

            it('with ==', function() {

              expect(myEnum.A == myEnum.A.value).to.be.ok();
              expect(myEnum.C == myEnum.C.value).to.be.ok();

            });

          });

          describe('an item and a value', function() {

            it('with is', function() {

              expect(myEnum.A.is(1)).to.be.ok();
              expect(myEnum.C.is(4)).to.be.ok();

            });

            it('with has', function() {

              expect(myEnum.A.has(1)).to.be.ok();
              expect(myEnum.C.has(4)).to.be.ok();

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

        });

        describe('call get with null and get', function() {

          it('null', function() {

            expect(myEnum.get(null)).to.eql(null);

          });

        });

        describe('call get with undefined and get', function() {

          it('null', function() {

            expect(myEnum.get(undefined)).to.eql(null);

          });

        });

        describe('call getValue and get', function() {

          it('an enum value by item', function() {

            expect(myEnum.getValue(myEnum.A)).to.eql(1);

            expect(myEnum.getValue(myEnum.C)).to.eql(4);

          });

          it('an enum value by key', function() {

            expect(myEnum.getValue('A')).to.eql(1);

            expect(myEnum.getValue('C')).to.eql(4);

          });

          it('an enum value by value', function() {

            expect(myEnum.getValue(1)).to.eql(1);

            expect(myEnum.getValue(4)).to.eql(4);

          });

        });

        describe('call getKey and get', function() {

          it('an enum key by item', function() {

            expect(myEnum.getKey(myEnum.A)).to.eql('A');

            expect(myEnum.getKey(myEnum.C)).to.eql('C');

          });

          it('an enum value by key', function() {

            expect(myEnum.getKey('A')).to.eql('A');

            expect(myEnum.getKey('C')).to.eql('C');

          });

          it('an enum value by value', function() {

            expect(myEnum.getKey(1)).to.eql('A');

            expect(myEnum.getKey(4)).to.eql('C');

          });

        });

      });

      describe('on an enum item it should be possible to', function() {

        it('call toString and get the key', function() {

          expect(myEnum.A.toString()).to.eql('A');

        });

        it('call toJSON and get the key', function() {

          expect(myEnum.A.toJSON()).to.eql('A');

        });

        it('call valueOf and get the value', function() {

          expect(myEnum.A.valueOf()).to.eql(myEnum.A.value);

        });

        it('use JavaScript | operator', function() {

          expect(myEnum.A | myEnum.B).to.eql(myEnum.getValue('A | B'));

          expect(myEnum.A | myEnum.C).to.eql(myEnum.getValue('A | C'));

          expect(myEnum.A | myEnum.B | myEnum.C).to.eql(myEnum.getValue('A | B | C'));

        });

        it('stringify JSON', function() {

          expect(JSON.stringify(myEnum.A)).to.eql('"A"');

        });

      });

    });

    describe('on an enum object', function(){

      var myEnum;

      before(function(){
        myEnum = new e({'A':1, 'B':2, 'C':4});
      });

      it('can not extend after creation', function() {

        var extendMyEnum = Object.isExtensible(myEnum);
        expect(extendMyEnum).to.be(false);

       });

      it('does not accept changes to existing property values, throws', function() {

        expect(myEnum).to.have.property('C');
        expect(function() {
          myEnum['C'] = 3;
        }).to.throwError("The value can not be set; Enum Type is not extensible.");
        expect(function() {
          Object.defineProperty(myEnum, 'C', {value: 3, writable:true, configurable: true});
        }).to.throwError();
        expect(myEnum.get('C')).to.have.property('value', 4);
        expect(myEnum).to.equal(myEnum);

      });

      it('can not define new properties, throws', function() {

        expect(function() {
          Object.defineProperty(myEnum, 'D', {writable: true, enumerable:true});
        }).to.throwError();
        expect(myEnum.D).to.be(undefined);
        expect(myEnum).not.to.have.property('D');
        expect(myEnum).to.equal(myEnum);

      });

      it('is persistent to deletes', function() {

        var deleteEnumItem = delete myEnum['A'];
        expect(deleteEnumItem).to.be(false);
        expect(myEnum).to.have.property('A');
        expect(myEnum.get('A')).to.have.property('value', 1);
        expect(myEnum).to.equal(myEnum);

      });

      it('creates unique identity for each property', function() {

        var myEnum1 = new e({'A':1, 'B':2, 'C':4});
        var myEnum2 = new e({'A':1, 'B':2, 'C':4});
        expect(myEnum1.A).not.to.equal(myEnum2.A);
        expect(myEnum1.B).not.to.equal(myEnum2.B);
        expect(myEnum1.C).not.to.equal(myEnum2.C);
        expect(myEnum1).not.to.equal(myEnum2);

      });

      it('respects the order of properties for equality', function() {

        var m1 = Object.keys(myEnum);
        var m2 = Object.keys(myEnum).reverse();
        expect(m1).not.to.equal(m2);

      });

    });

    describe('beeing flagged', function() {

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

    describe('not beeing flagged', function() {

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

          expect(myNonFlaggedEnum.get(5)).to.not.be.ok();

        });

      });

      describe('call get with an non valid value and get', function() {

        it('null', function() {

          expect(myNonFlaggedEnum.get(12345)).to.eql(null);

        });

      });

      describe('call get with 0 and get', function() {

        it('null', function() {

          expect(myNonFlaggedEnum.get(0)).to.not.eql(null);

        });

      });

    });

    describe('and getting an item of it from an other enum', function () {

      it('it should return null', function() {

        var myEnum1 = new e(['A', 'B', 'C']);

        var myEnum2 = new e({'A': 1, 'B': 2, 'C': 4});

        expect(myEnum2.get(myEnum1.A)).to.eql(null);

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

        expect(myEnum.get(buffer)).to.eql(myEnum.B);

      });

      it('should work with Buffer for `set()`', function () {

        var myEnum = new e(['A', 'B', 'C']);
        var buffer = new Buffer(myEnum.size);

        myEnum.set(buffer, 0, myEnum.B);

        expect(buffer['readUInt32' + endianness](0)).to.eql(myEnum.B.value);

      });

    });

    describe('beeing not case sensitive', function() {

      var myEnum = new e(['One', 'tWo', 'ThrEE'], { ignoreCase: true });

      it('it should work correctly even if not requesting exactly the same key value', function() {

        expect(myEnum.get('one').value).to.eql(myEnum.One.value);
        expect(myEnum.get('two').value).to.eql(myEnum.tWo.value);
        expect(myEnum.get('THREE').value).to.eql(myEnum.ThrEE.value);

        expect(myEnum.One.is('onE')).to.eql(true);
        expect(myEnum.tWo.is('Two')).to.eql(true);
        expect(myEnum.ThrEE.is('three')).to.eql(true);

        expect(myEnum.One.has('onE')).to.eql(true);
        expect(myEnum.tWo.has('Two')).to.eql(true);
        expect(myEnum.ThrEE.has('three')).to.eql(true);

      });

    });

  });

});
