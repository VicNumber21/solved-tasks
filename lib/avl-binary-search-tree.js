class AvlBst {
  insert(key, data) {
    const node = new AvlBstNode(key, data);
    this.root = this._insert(this.root, node);
  }

  _insert(treeNode, newNode) {
    let node = newNode;

    if (treeNode) {
      if (newNode.key < treeNode.key) {
        const absChildBalance = treeNode.left ? Math.abs(treeNode.left.balance) : -1;
        treeNode.left = this._insert(treeNode.left, newNode);
        treeNode.balance -= absChildBalance < Math.abs(treeNode.left.balance) ? 1 : 0;
      }
      else {
        const absChildBalance = treeNode.right ? Math.abs(treeNode.right.balance) : -1;
        treeNode.right = this._insert(treeNode.right, newNode);
        treeNode.balance += absChildBalance < Math.abs(treeNode.right.balance) ? 1 : 0;
      }

      node = this._balance(treeNode);
    }

    return node;
  }

  // TODO no reason to implement delete for burger happiness task
  // since it is not easy thing, I will implement that when really needed
  // links:
  // https://www.geeksforgeeks.org/avl-tree-set-2-deletion/
  // https://cs.stackexchange.com/questions/16313/updating-an-avl-tree-based-on-balance-factors
  // https://cs.stackexchange.com/questions/48861/balance-factor-changes-after-local-rotations-in-avl-tree
  // https://en.wikipedia.org/wiki/AVL_tree
  delete(key) {
    let data;
    [this.root, data] = this._delete(this.root, key);

    return data;
  }

  _delete(node, key) {
    let data;

    if (node) {
      if (key < node.key) {
        [node.left, data] = this._delete(node.left, key);
        // TODO update balance
      }
      else if (key > node.key) {
        [node.right, data] = this._delete(node.right, key);
        // TODO update balance
      }
      else {
        data = node.data;
        const [ leftChild, rightChild ] = [ node.left, node.right ];

        if (!leftChild && !rightChild) {
          node = undefined;
        }
        else if (leftChild && !rightChild) {
          node = leftChild;
        }
        else if (rightChild && !leftChild) {
          node = rightChild
        }
        else {
          // TODO update balance
          [ node ] = this._delete(rightChild, this.mostLeftNode(rightChild).key);
          node.left = leftChild;
          node.right = (node === rightChild) ? node.right : rightChild;
        }
      }

      node = this._balance(node);
    }

    return [node, data];
  }

  mostLeftNode (node) {
    let mostLeft = node;

    while (mostLeft && mostLeft.left) {
      mostLeft = mostLeft.left;
    }

    return mostLeft;
  }

  _balance(node) {
    if (!node.isBalanced()) {
      const [ LeftLeftCase, LeftRightCase, RightLeftCase, RightRightCase ] = [ -3, -1 , 1, 3 ];

      // noinspection FallThroughInSwitchStatementJS
      switch (node.imbalanceCase()) {
        case LeftRightCase:
          node.left = this._rotateLeft(node.left);
        case LeftLeftCase:
          node = this._rotateRight(node);
          break;

        case RightLeftCase:
          node.right = this._rotateRight(node.right);
        case RightRightCase:
          node = this._rotateLeft(node);
          break;
      }
    }

    return node;
  }

  _rotateLeft(node) {
    const [ leftNode, rightNode ] = [ node, node.right ];
    const leftOfRightNode = rightNode.left;
    [ rightNode.left, leftNode.right ] = [ leftNode, leftOfRightNode ];

    leftNode.balance = leftNode.balance - 1 - Math.max(rightNode.balance, 0);
    rightNode.balance = rightNode.balance - 1 + Math.min(leftNode.balance, 0);

    return rightNode;
  }

  _rotateRight(node) {
    const [ rightNode, leftNode ] = [ node, node.left ];
    const rightOfLeftNode = leftNode.right;
    [ leftNode.right, rightNode.left ] = [ rightNode, rightOfLeftNode ];

    rightNode.balance = rightNode.balance + 1 - Math.min(leftNode.balance, 0);
    leftNode.balance = leftNode.balance + 1 + Math.max(rightNode.balance, 0);

    return leftNode;
  }
}

class AvlBstNode {
  constructor(key, data) {
    [ this.key, this.data, this.balance ] = [ key, data,  0 ];
  }

  isBalanced() {
    return Math.abs(this.balance) < 2;
  }

  imbalanceCase() {
    let ret = this.balance;
    ret += this.balance < 0 ? this.left.balance : this.right.balance;

    return ret;
  }
}
