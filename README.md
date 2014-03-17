# Introduction

[![Build Status](https://secure.travis-ci.org/adrai/enum.png)](http://travis-ci.org/adrai/enum)

Enum is a javascript module that introduces the Enum Type. It works for node.js and in the browser.

# Dependencies
No dependencies!

# Download
Releases for a browser are available for download from GitHub.

| **Version** | **Description** | **Size** |
|:------------|:----------------|:---------|
| `enum-0.2.6.js` | *uncompressed, with comments* | [Download](https://raw.github.com/adrai/enum/master/enum-0.2.6.js) |
| `enum-0.2.6.min.js` | *compressed, without comments* | [Download](https://raw.github.com/adrai/enum/master/enum-0.2.6.min.js) |

# Installation (node.js)

    $ npm install enum

# Installation (browser, library is AMD compatible)

    <script src="enum.js"></script>

# Usage

    // use it as module
    var Enum = require('enum');

    // or extend node.js with this new type
    require('enum').register();

    // define a simple enum (automatically flaggable -> A: 0x01, B: 0x02, C: 0x04)
    var myEnum = new Enum(['A', 'B', 'C']);

    // define an enum with own values
    var myEnum = new Enum({'A': 1, 'B': 2, 'C': 4});

    // if defining an flaggable enum, you can define your own separator (default is ' | ')
    var myEnum = new Enum(['A', 'B', 'C'], { separator: ' | ' });

    // if you want your enum to have a name define it in the options
    var myEnum = new Enum(['A', 'B', 'C'], { name: 'MyEnum' });

    // or
    var myEnum = new Enum(['A', 'B', 'C'], 'MyEnum');


    // get your item
    myEnum.A

    // or
    myEnum.get('A')

    // or
    myEnum.get(1)

    // or
    myEnum.get('A | B')

    // or
    myEnum.get(3)


    // get your value
    myEnum.A.value

    // get your key
    myEnum.A.key


    // get all items
    myEnum.enums // returns all enums in an array


    // compare
    myEnum.A.is(myEnum.A)

    // or
    myEnum.A.is('A')

    // or
    myEnum.A.is(1)

    // or
    myEnum.A == 'A'

    // or
    myEnum.A == myEnum.A

    // or
    myEnum.A === myEnum.A


    // check flag
    var myItem = myEnum.get(3); // or [myEnum.get('A | B')]
    myItem.has(myEnum.A)

    // or
    myItem.has('A')

    // or
    myItem.has(1)


    // other functions
    myItem.toString() // returns A | C
    myItem.toJSON() // returns A | C
    myItem.valueOf() // returns A | C
    
    JSON.stringify(myItem) // returns A | C


# License

Copyright (c) 2014 Adriano Raiano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.