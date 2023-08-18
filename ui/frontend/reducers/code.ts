import { Action, ActionType } from '../actions';
import { Example } from '../types';

const HELLO_WORLD: State = `fn main() {
    println!("Hello, world!");
}`;

const PIR: State = `use sunscreen::{
    fhe_program,
    types::{bfv::Signed, Cipher},
    Ciphertext, CompiledFheProgram, Compiler, Error, FheProgramInput, FheRuntime, Params,
    PrivateKey, PublicKey,
};

const SQRT_DATABASE_SIZE: usize = 10;

#[fhe_program(scheme = "bfv")]
/// This program takes a user's query and looks up the entry in the database.
/// Queries are arrays containing a single 1 element at the
/// desired item's index and 0s elsewhere.
fn lookup(
    col_query: [Cipher<Signed>; SQRT_DATABASE_SIZE],
    row_query: [Cipher<Signed>; SQRT_DATABASE_SIZE],
    database: [[Signed; SQRT_DATABASE_SIZE]; SQRT_DATABASE_SIZE],
) -> Cipher<Signed> {
    // Safe Rust requires you initialize arrays with some value. Just put
    // put copies of col_query[0] and we'll overwrite them later.
    let mut col = [col_query[0]; SQRT_DATABASE_SIZE];

    // Perform matrix-vector multiplication with col_query to extract
    // Alice's desired column
    for i in 0..SQRT_DATABASE_SIZE {
        for j in 0..SQRT_DATABASE_SIZE {
            if j == 0 {
                col[i] = database[i][j] * col_query[j];
            } else {
                col[i] = col[i] + database[i][j] * col_query[j];
            }
        }
    }

    let mut sum = col[0] * row_query[0];

    // Dot product the result with the row query to get the result
    for i in 1..SQRT_DATABASE_SIZE {
        sum = sum + col[i] * row_query[i];
    }

    sum
}

/// This is the server that processes Alice's query.
struct Server {
    /// The compiled database query program
    pub compiled_lookup: CompiledFheProgram,

    /// The server's runtime
    runtime: FheRuntime,
}

impl Server {
    pub fn setup() -> Result<Server, Error> {
        let app = Compiler::new().fhe_program(lookup).compile()?;

        let runtime = FheRuntime::new(app.params())?;

        Ok(Server {
            compiled_lookup: app.get_fhe_program(lookup).unwrap().clone(),
            runtime,
        })
    }

    pub fn run_query(
        &self,
        col_query: Ciphertext,
        row_query: Ciphertext,
        public_key: &PublicKey,
    ) -> Result<Ciphertext, Error> {
        // Our database will consist of values between 400 and 500.
        let mut database = [[Signed::from(0); SQRT_DATABASE_SIZE]; SQRT_DATABASE_SIZE];
        let mut val = Signed::from(400);

        for row in database.iter_mut() {
            for entry in row.iter_mut() {
                *entry = val;
                val = val + 1;
            }
        }

        let args: Vec<FheProgramInput> = vec![col_query.into(), row_query.into(), database.into()];

        let results = self.runtime.run(&self.compiled_lookup, args, public_key)?;

        Ok(results[0].clone())
    }
}

/// Alice is a party that wants to look up a value in the database without
/// revealing what she looked up.
struct Alice {
    /// Alice's public key
    pub public_key: PublicKey,

    /// Alice's private key
    private_key: PrivateKey,

    /// Alice's runtime
    runtime: FheRuntime,
}

impl Alice {
    pub fn setup(params: &Params) -> Result<Alice, Error> {
        let runtime = FheRuntime::new(params)?;

        let (public_key, private_key) = runtime.generate_keys()?;

        Ok(Alice {
            public_key,
            private_key,
            runtime,
        })
    }

    pub fn create_query(&self, index: usize) -> Result<(Ciphertext, Ciphertext), Error> {
        let col = index % SQRT_DATABASE_SIZE;
        let row = index / SQRT_DATABASE_SIZE;

        let mut col_query = [Signed::from(0); SQRT_DATABASE_SIZE];
        let mut row_query = [Signed::from(0); SQRT_DATABASE_SIZE];
        col_query[col] = Signed::from(1);
        row_query[row] = Signed::from(1);

        Ok((
            self.runtime.encrypt(col_query, &self.public_key)?,
            self.runtime.encrypt(row_query, &self.public_key)?,
        ))
    }

    pub fn check_response(&self, value: Ciphertext) -> Result<(), Error> {
        let value: Signed = self.runtime.decrypt(&value, &self.private_key)?;

        let value: i64 = value.into();

        println!("Alice received {value}");
        assert_eq!(value, 494);

        Ok(())
    }
}

fn main() -> Result<(), Error> {
    // Set up the database
    let server = Server::setup()?;

    // Alice sets herself up. The FHE scheme parameters are public to the
    // protocol, so Alice has them.
    let alice = Alice::setup(&server.compiled_lookup.metadata.params)?;

    let (col_query, row_query) = alice.create_query(94)?;

    let response = server.run_query(col_query, row_query, &alice.public_key)?;

    alice.check_response(response)?;

    Ok(())
}
`;

const SUDOKU: State = `use sunscreen::{
    bulletproofs::BulletproofsBackend,
    types::zkp::{BulletproofsField, Field, FieldSpec},
    zkp_program, zkp_var, Error, ZkpProgramFnExt,
};

#[zkp_program]
fn sudoku_proof<F: FieldSpec>(solution: [[Field<F>; 9]; 9], #[public] board: [[Field<F>; 9]; 9]) {
    let zero = zkp_var!(0);

    let assert_unique_numbers = |squares| {
        for i in 1..=9 {
            let mut circuit = zkp_var!(1);
            for s in squares {
                circuit = circuit * (zkp_var!(i) - s);
            }
            circuit.constrain_eq(zero);
        }
    };

    // Checks rows contain every number from 1 to 9
    for row in solution {
        assert_unique_numbers(row);
    }

    // Checks columns contain each number from 1 to 9
    for col in 0..9 {
        let column = solution.map(|r| r[col]);
        assert_unique_numbers(column);
    }

    // Checks squares contain each number from 1 to 9
    for i in 0..3 {
        for j in 0..3 {
            let rows = &solution[(i * 3)..(i * 3 + 3)];

            let square = rows.iter().map(|s| &s[(j * 3)..(j * 3 + 3)]);

            let flattened_sq = square
                .flatten()
                .copied()
                .collect::<Vec<_>>()
                .try_into()
                .unwrap_or([zero; 9]);

            assert_unique_numbers(flattened_sq);
        }
    }

    // Proves that the solution matches up with the puzzle where applicable
    for i in 0..9 {
        for j in 0..9 {
            let square = solution[i][j];
            let constraint = board[i][j];
            (constraint * (constraint - square)).constrain_eq(zero);
        }
    }
}

fn main() -> Result<(), Error> {
    let prog = sudoku_proof.compile::<BulletproofsBackend>()?;
    let runtime = sudoku_proof.runtime::<BulletproofsBackend>()?;

    let ex_board = [
        [0, 7, 0, 0, 2, 0, 0, 4, 6],
        [0, 6, 0, 0, 0, 0, 8, 9, 0],
        [2, 0, 0, 8, 0, 0, 7, 1, 5],
        [0, 8, 4, 0, 9, 7, 0, 0, 0],
        [7, 1, 0, 0, 0, 0, 0, 5, 9],
        [0, 0, 0, 1, 3, 0, 4, 8, 0],
        [6, 9, 7, 0, 0, 2, 0, 0, 8],
        [0, 5, 8, 0, 0, 0, 0, 6, 0],
        [4, 3, 0, 0, 8, 0, 0, 7, 0],
    ];

    let ex_sol = [
        [8, 7, 5, 9, 2, 1, 3, 4, 6],
        [3, 6, 1, 7, 5, 4, 8, 9, 2],
        [2, 4, 9, 8, 6, 3, 7, 1, 5],
        [5, 8, 4, 6, 9, 7, 1, 2, 3],
        [7, 1, 3, 2, 4, 8, 6, 5, 9],
        [9, 2, 6, 1, 3, 5, 4, 8, 7],
        [6, 9, 7, 4, 1, 2, 5, 3, 8],
        [1, 5, 8, 3, 7, 9, 2, 6, 4],
        [4, 3, 2, 5, 8, 6, 9, 7, 1],
    ];

    let solution = ex_sol.map(|a| a.map(BulletproofsField::from));

    let board = ex_board.map(|a| a.map(BulletproofsField::from));

    let proof = runtime.prove(&prog, vec![solution], vec![board], vec![])?;

    runtime.verify(&prog, &proof, vec![board], vec![])?;

    Ok(())
}
`;

export type State = string;

const exampleMap = {
  [Example.Pir]: PIR,
  [Example.Sudoku]: SUDOKU,
};

export default function code(state = PIR, action: Action): State {
  switch (action.type) {
    case ActionType.ChangeExample:
      if (action.changeCode) {
        return exampleMap[action.example];
      } else {
        return state;
      }

    case ActionType.RequestGistLoad:
      return '';

    case ActionType.GistLoadSucceeded:
      return action.code;

    case ActionType.EditCode:
      return action.code;

    case ActionType.AddMainFunction:
      return `${state}\n\n${HELLO_WORLD}`;

    case ActionType.AddImport:
      return action.code + state;

    case ActionType.EnableFeatureGate:
      return `#![feature(${action.featureGate})]\n${state}`;

    case ActionType.FormatSucceeded:
      return action.code;

    default:
      return state;
  }
}
