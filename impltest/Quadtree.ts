/*
 * Javascript Quadtree
 * @version 1.1.1
 * @licence MIT
 * @author Timo Hausmann
 * https://github.com/timohausmann/quadtree-js/
 */

/*
 Copyright © 2012 Timo Hausmann
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENthis. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
export interface Bounds {
    x: number, y: number, width: number, height: number
}
export class Quadtree<T> {
    objects = [] as Bounds[];
    objectsO = [] as T[];
    nodes = [] as Quadtree<T>[];
    /*
     * Quadtree Constructor
     * @param Object bounds		bounds of the node, object with x, y, width, height
     * @param Integer max_objects		(optional) max objects a node can hold before splitting into 4 subnodes (default: 10)
     * @param Integer max_levels		(optional) total max levels inside root Quadtree (default: 4)
     * @param Integer level		(optional) deepth level, required for subnodes
     */
    constructor(public bounds: Bounds, public max_objects: number, public max_levels: number, public level?: number) {
        if (this.level === undefined) this.level = 0;
    };


	/*
	 * Split the node into 4 subnodes
	 */
    split() {
        const nextLevel = this.level + 1,
            width = Math.round(this.bounds.width / 2),
            height = Math.round(this.bounds.height / 2),
            x = Math.round(this.bounds.x),
            y = Math.round(this.bounds.y);
        //top right node
        this.nodes[0] = new Quadtree<T>({
            x: x + width, y, width, height
        }, this.max_objects, this.max_levels, nextLevel);

        //top left node
        this.nodes[1] = new Quadtree<T>({
            x, y, width, height
        }, this.max_objects, this.max_levels, nextLevel);

        //bottom left node
        this.nodes[2] = new Quadtree<T>({
            x, y: y + height, width, height
        }, this.max_objects, this.max_levels, nextLevel);

        //bottom right node
        this.nodes[3] = new Quadtree<T>({
            x: x + width, y: y + height, width, height
        }, this.max_objects, this.max_levels, nextLevel);
    };


	/*
	 * Determine which node the object belongs to
	 * @param Object pRect		bounds of the area to be checked, with x, y, width, height
	 * @return Integer		index of the subnode (0-3), or -1 if pRect cannot completely fit within a subnode and is part of the parent node
	 */
    getIndex(pRect: Bounds) {
        var index = -1,
            verticalMidpoint = this.bounds.x + (this.bounds.width / 2),
            horizontalMidpoint = this.bounds.y + (this.bounds.height / 2),

            //pRect can completely fit within the top quadrants
            topQuadrant = (pRect.y < horizontalMidpoint && pRect.y + pRect.height < horizontalMidpoint),

            //pRect can completely fit within the bottom quadrants
            bottomQuadrant = (pRect.y > horizontalMidpoint);

        //pRect can completely fit within the left quadrants
        if (pRect.x < verticalMidpoint && pRect.x + pRect.width < verticalMidpoint) {
            if (topQuadrant) {
                index = 1;
            } else if (bottomQuadrant) {
                index = 2;
            }

            //pRect can completely fit within the right quadrants
        } else if (pRect.x > verticalMidpoint) {
            if (topQuadrant) {
                index = 0;
            } else if (bottomQuadrant) {
                index = 3;
            }
        }

        return index;
    };


	/*
	 * Insert the object into the node. If the node
	 * exceeds the capacity, it will split and add all
	 * objects to their corresponding subnodes.
	 * @param Object pRect		bounds of the object to be added, with x, y, width, height
	 */
    insert(pRect: Bounds, obj: T) {
        var i = 0, index: number;

        //if we have subnodes ...
        if (typeof this.nodes[0] !== 'undefined') {
            index = this.getIndex(pRect);

            if (index !== -1) {
                this.nodes[index].insert(pRect, obj);
                return;
            }
        }

        this.objects.push(pRect);
        this.objectsO.push(obj);

        if (this.objects.length > this.max_objects && this.level < this.max_levels) {

            //split if we don't already have subnodes
            if (typeof this.nodes[0] === 'undefined') {
                this.split();
            }

            //add all objects to there corresponding subnodes
            while (i < this.objects.length) {

                index = this.getIndex(this.objects[i]);

                if (index !== -1) {
                    this.nodes[index].insert(this.objects.splice(i, 1)[0], this.objectsO.splice(i, 1)[0]);
                } else {
                    i = i + 1;
                }
            }
        }
    };


	/*
	 * Return all objects that could collide with the given object
	 * @param Object pRect		bounds of the object to be checked, with x, y, width, height
	 * @Return Array		array with all detected objects
	 */
    retrieve(pRect: Bounds) {
        var index = this.getIndex(pRect),
            returnObjects = this.objectsO;

        //if we have subnodes ...
        if (typeof this.nodes[0] !== 'undefined') {
            //if pRect fits into a subnode ..
            if (index !== -1) {
                returnObjects = returnObjects.concat(this.nodes[index].retrieve(pRect));

                //if pRect does not fit into a subnode, check it against all subnodes
            } else {
                for (var i = 0; i < this.nodes.length; i = i + 1) {
                    returnObjects = returnObjects.concat(this.nodes[i].retrieve(pRect));
                }
            }
        }

        return returnObjects;
    };


	/*
	 * Clear the quadtree
	 */
    clear() {
        this.objects = [];
        this.objectsO = [];

        for (var i = 0; i < this.nodes.length; i = i + 1) {
            if (typeof this.nodes[i] !== 'undefined') {
                this.nodes[i].clear();
            }
        }
        this.nodes = [];
    };
}